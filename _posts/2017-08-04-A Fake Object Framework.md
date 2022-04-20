___
title: A Fake Object Framework
authors: b3m2a1
date: 2017-08-04 17:57:46
disqus_id: b3m2a1-home-26119950-8d56-478a-9339-dda09c8ae108
modified: 2017-08-06 00:58:47
permalink: a-fake-object-framework
tags: mathematica
___


I promised in my post on  [chemistry and objects](https://www.wolframcloud.com/objects/b3m2a1/home/-pretend-chemistry-and-fake-objects.html)  that I’d walk through the details of building an object framework in Mathematica so here we are. For those who would like to follow along,  [here](https://github.com/b3m2a1/mathematica-ObjectFramework/blob/master/Packages/ObjectFramework.m)  is the package that implements this framework.

Just as a quick refresher, there were a few properties that we decided we’d use in our framework. These were:

* Objects are glorified hash-maps

* Objects have types

* Methods get bound to objects

* There are properties which are bound methods that evaluate when accessed

* Everything important is vectorized (i.e. can be done over vectors)

We’ll start with the first of those.

<a id="building-an-object" >&zwnj;</a>

## Building an Object

### Objects as Hash Maps

A  [hash-map](https://en.wikipedia.org/wiki/Hash_table)  is a data structure that provides very efficient look-up and insertion. Both of these will be crucial for us. Mathematica’s top-level version of as hash-map is called an  [```Association```](https://reference.wolfram.com/language/ref/Association.html) . So we’ll simply store all object data in one of these. With that in mind, we could then go one of three routes:

* Each object stores its data in a symbol it holds

* All object data is stored in a single symbol

* Each object stores its data in a symbol and there’s a central store for all these symbols

For reasons of convenience we will choose the second. If there will be massive amounts of object data store the last may be the best, performance wise, but provides somewhat more involved property setting. The first makes it hard to know what exactly is an object. Both the first and last similarly make restoring state somewhat more challenging.

So we’ll initialize an  ```Association```  for storing all of our data:

	$OFObjectTable = <|
	     
	   "Types" -> <|
	        "Object" -> <||>
	        |>,
	     "Objects" -> <||>
	     |>;

Note that we have two sub-maps, one for basic type data, one for object data. This leads us to the second point on that list, “Objects have types”. But before we even get there, we’ll need to look at how we define our objects.

### Object Creation

Now that we know how we’ll store our objects, the question is how should we build a new one. Since we’re working with an  ```Association```  we need some a way to define a unique key for each object. There are a few possible routes here, but the one I’ve found to be easiest works through  [```CreateUUID```](https://reference.wolfram.com/language/ref/CreateUUID.html)  for the following reasons:

* It's essentially assured to be universally unique, which makes storage and recall easy

* The keys are strings, so assured to be without side effects

* We can attach little meta-tags to the front of the key to give us a hint of what we’re working with

For our object definitions we’ll take an  ```Association```  of properties as the core data, where we extract the type from the  ```"ObjectType"```  field passed. Since it’s vectorized we’ll write it with a  ```List```  of  ```Association```  objects in mind:

	Options[OFNewObject] =
	   {
	     "Initialize" -> True,
	     "UUIDMethod" -> (CreateUUID[# <> "-"] &)
	     };
	OFNewObject[objs : {__Association}, ops : OptionsPattern[]] :=
	   
	  Catch@
	    Module[{
	       types = Lookup[objs, "ObjectType", "Object"],
	       args = Lookup[objs, "ObjectInitializationArguments", {}],
	       uuids,
	       objlist
	       },
	      If[! AllTrue[types, StringQ], 
	     Message[OFNewObject::types, types]; Throw[$Failed]];
	      uuids =
	        MapIndexed[
	          OptionValue["UUIDMethod"],
	          types
	          ];
	      If[! AllTrue[uuids, StringQ], 
	     Message[OFNewObject::uuids, uuids]; Throw[$Failed]];
	      objlist = OFObject /@ uuids;
	      AssociateTo[$OFObjectTable["Objects"],
	        MapThread[
	          #3 ->
	             Join[
	               #,
	               <|
	                 "ObjectType" -> #2,
	                 "ObjectID" -> #3
	                 |>
	               ] &,
	          {
	            KeyDrop[objs, "ObjectInitializationArguments"],
	            types,
	            uuids
	            }]
	        ];
	      If[OptionValue["Initialize"],
	        MapThread[
	          Function[# @@ #2],
	          {
	            OFLookup[objlist, "ObjectInitialization", Identity],
	            args
	            }]
	        ];
	      objlist
	     ];

What this does is determines the type for each object, creates a new UUID for each, sticks  ```UUID -> Association```  pairs into the  ```$OFObjectTable```  and then calls an  ```"ObjectInitialization"```  function on each with some collection of passed arguments, assuming it’s been defined. Then it wraps all the new UUIDs in an  ```OFObject```  head and spits them back out.

One thing to notice is that this is actually already boot-strapping. We call the standard object framework lookup function,  ```OFLookup``` , in the definition process.

Then, since making new objects like this is a little bit unwieldy to use, we’ll put some syntactic sugar on it:

	OFNewObject[a : {((_String -> _Association) | _String) ..}] :=
	   
	  OFNewObject@
	     Map[
	       If[Length[#] == 2,
	          Append[#[[2]], "ObjectType" -> #[[1]]],
	          <|"ObjectType" -> #|>
	          ] &,
	       a];
	OFNewObject[
	   a : _Association | _String | (_String -> _Association)] :=
	   
	  First@OFNewObject[{a}];

These two make creating new objects just a little bit nicer. 

Even the vectorized form is a little bit slow:

	RepeatedTiming[
	  objs = OFNewObject[ConstantArray["Object", 100000]];] // First

	(*Out:*)
	
	2.55

But that’s largely unavoidable. It can be sped up somewhat by providing precomputed UUIDs:

	With[{uuids = ToString /@ Range[100000]},
	  RepeatedTiming[
	     objs =
	        OFNewObject[ConstantArray["Object", 100000],
	          "UUIDMethod" -> (uuids[[First@#2]] &)
	          ];] // First
	  ]

	(*Out:*)
	
	1.82

Or by specifying no initialization should happen:

	RepeatedTiming[
	   objs =
	      OFNewObject[ConstantArray["Object", 100000],
	        "Initialize" -> False
	        ];] // First

	(*Out:*)
	
	1.97

But beyond that there’s not much one can do.

### Object Types, Part 1

In our setup, types serve as meta objects, from which instances inherit property and are spawned. We’ll implement a single-inheritance scheme, since I’m lazy. Our types will live in the  ```"Types"```  sub- ```Association```  of our  ```$OFObjectTable``` . They will function almost exactly like objects, though.

We’ll get into a larger discussion about them later

<a id="object-basics" >&zwnj;</a>

## Object Basics

### Property Lookup

This is the heart of the project, from which everything else will derive. Our lookup will be implemented in a vectorized manner, layered on  [```Lookup```](https://reference.wolfram.com/language/ref/Lookup.html) . Our base case will just be looking up a raw object  ```Association``` . But first, since we noted our types will work like objects, we need a nice way to do lookups on either. The way we’ll do that is through a variable  ```$OFLookupGroup```  which will be  ```"Objects"```  or  ```"Types"``` . Now for the raw data lookup:

	OFLookup[k_String | OFObject[k_String]] :=
	   
	  Lookup[$OFObjectTable[$OFLookupGroup], k];
	OFLookup[k : {__String}] :=
	   
	  Lookup[$OFObjectTable[$OFLookupGroup], k];
	OFLookup[k : {__OFObject}] :=
	   
	  Lookup[$OFObjectTable[$OFLookupGroup], First /@ k];

That’s trivial, of course, so we move on to a property lookup:

	OFLookup[
	    keys : {__String}, p_,
	    default_: Missing["KeyAbsent"]] :=
	   MapThread[
	     OFPostLookup,
	     {
	       OFRecursiveLookup[
	         Lookup[$OFObjectTable[$OFLookupGroup], keys],
	         p,
	         default
	         ],
	       keys
	       }
	     ];

Note that the heart of this is really missing. We need the following two functions to truly know what’s up. One for vectorized recursive lookups:

	OFRecursiveLookup[
	    objs : {__Association},
	    keys_,
	    default_: $OFMissingKeyAbsent
	    ] :=
	   Module[{
	      missingKey = Unique[$OFMissingKeyAbsent],
	      types =
	        Lookup[objs, "ObjectType", "Object"],
	      typeroot = Lookup[$OFObjectTable["Types"], "Object", <||>]
	      },
	     types =
	       Lookup[$OFObjectTable["Types"], types, typeroot];
	     If[default === $OFMissingKeyAbsent,
	        Map[
	          If[ListQ@keys,
	             MapThread[
	               If[# === missingKey,
	                  Missing["KeyAbsent", #2],
	                  #
	                  ] &,
	               {
	                 #,
	                 keys
	                 }
	               ],
	             If[# === missingKey,
	               Missing["KeyAbsent", keys],
	               #
	               ]
	             ] &
	          ],
	        Identity
	        ]@
	       Replace[
	         OFrecursiveLookupStep[objs, types, keys, default, missingKey,
	       typeroot],
	         missingKey -> default,
	         {2}
	         ]
	     ];
	(*Recursive lookup step*)
	OFrecursiveLookupStep[
	    objs_,
	    types_,
	    keys_,
	    default_,
	    missing_,
	    typeroot_
	    ] :=
	   Module[{
	      props = Lookup[objs, keys, missing],
	      missingpos,
	      objnew,
	      typenew
	      },
	     missingpos = First /@ Position[props, missing, {1}];
	     objnew = DeleteCases[types[[missingpos]], typeroot];
	     If[Length@objnew == 0,
	       props,
	       typenew =
	         Lookup[
	           $OFObjectTable["Types"],
	           Lookup[objnew, "ObjectType", "Object"],
	           typeroot
	           ];
	       ReplacePart[props,
	         Thread[
	           
	      missingpos ->
	             
	       OFrecursiveLookupStep[objnew, typenew, keys, default, missing, 
	        typeroot]
	           ]
	         ]
	       ]
	     ];

And one for post-processing our lookups:

	OFPostLookup[e_OFMethod, id_] :=
	   If[$OFPrepMethods // TrueQ,
	     OFPrepMethod[e, id],
	     e
	     ];
	OFPostLookup[l : _List, id_] :=
	   OFPostLookup[#, id] & /@ l;
	OFPostLookup[e : Except[_OFMethod | _List], id_] :=
	   e;
	(*Method binding*)
	
	OFPrepMethod[OFMethod[f_, a_Association], id_String] :=
	   With[{
	      atts = Lookup[a, "Attributes", {HoldAllComplete}],
	      autoEval = Lookup[a, "Evaluate", False],
	      obj =
	        Replace[
	          Lookup[a, "PassFirst", OFObject@id], {
	            OFType | "ObjectType" :>
	              OFType@Lookup[id, "ObjectType", "Object"],
	            None :>
	              Sequence[]
	           }]},
	     If[autoEval,
	       f[obj],
	       Function[Null, f[obj, ##], atts]
	       ]
	     ];
	OFPrepMethod[OFMethod[f_], id_String] :=
	   With[{obj = OFObject@id},
	     Function[Null, f[obj, ##], HoldAllComplete]
	     ];

Where that  ```OFPrepMethod```  is a function that will bind an  ```OFMethod```  to an object instance via a pure  ```Function```

Now we see where that  ```"ObjectType"```  comes in.  ```OFRecursiveLookup```  will recurse through an object’s ancestors until it hits no more ancestors or it hits the property.

### Application

All of our setting / getting will be defined in terms of object mutations. The basic idea is that we’ll define a single function,  ```OFApply``` , which will get parts of an object, and apply a function to them. And then do this in a vectorized way. We can then define a function  ```OFMutate```  on that that automatically calls  ```Set```  on the result.

We’ll need, once again, a symbol to tell us whether we’re working with the  ```"Objects"```  or  ```"Types"```  which we’ll call  ```$OFApplicationGroup``` . Then the heart of the function looks like this:

	OFApply[k : {__String}, f_] :=
	   
	  With[{$OFApplicationGroup = $OFApplicationGroup},
	     If[KeyMemberQ[$OFObjectTable[$OFApplicationGroup], #],
	         f[
	           $OFObjectTable[$OFApplicationGroup, #],
	           HoldPattern[$OFObjectTable[$OFApplicationGroup, #]]
	           ],
	         Missing["KeyAbsent", #]
	         ] & /@ k
	     ];
	OFApply[k : {__String}, p_, f_] :=
	   
	  With[{$OFApplicationGroup = $OFApplicationGroup},
	     If[KeyMemberQ[$OFObjectTable[$OFApplicationGroup], #],
	         f[
	           OFLookup[#, p],
	           HoldPattern[$OFObjectTable[$OFApplicationGroup, #, p]]
	           ],
	         Missing["KeyAbsent", #]
	         ] & /@ k
	     ];

Where we actually have two different cases. One where there’s no property to apply to, and one where there is. Branching it like this simplifies the definition process and lets us speed up each. Note that the actual group to be assigned to is passed in the second symbol, to make things easier in setting, etc.

### Property Setting

We can then define a  ```OFSet```  function and friends off of an  ```OFApply```  call. In fact, the entire function is just this:

	OFSet[k : objectPattern, p : Except[_List], v_] :=
	   OFApply[k, p,
	     Function[Null,
	       Set[#2, v],
	       HoldFirst
	       ]
	     ];

In fact, it’s just a  ```Set```  delegate.

And then we can define a number of other such delegates, say for  ```SetDelayed```

	OFSetDelayed[k : objectPattern, p_, v_] :=
	   OFApply[k, p,
	     Function[Null,
	       SetDelayed[#2, v],
	       HoldAllComplete
	       ]
	     ];
	OFSetDelayed~SetAttributes~HoldAllComplete

Or a threaded  ```Set```  (with a delayed companion):

	OFSetThread[k : objectPattern, p_, v_] :=
	   
	  With[{base = Thread[p -> v]},
	     OFApply[k,
	       Function[Null,
	         AssociateTo[Evaluate@Extract[#2, 1, Unevaluated], base],
	         HoldAllComplete
	         ]
	       ];
	     v
	     ];

Or on a  ```Part```  (again, with a delayed companion)

	OFSetPart[k : objectPattern, key_, parts__, value_] :=
	  
	 OFApply[k, key,
	    Function[Null,
	      Replace[Unevaluated[#],
	        HoldPattern[$OFObjectTable[p__]] :>
	          
	     Set[$OFObjectTable[[p, parts]], value]
	        ],
	      HoldAllComplete
	      ]
	    ]

And so forth.

### Simplified Mutation Syntax

We can then take advantage of  ```Language`SetMutationHandler```  to mutate these objects from a  ```Symbol```  without going through an  [```Evaluate```](https://reference.wolfram.com/language/ref/Evaluate.html)  or  [```With```](https://reference.wolfram.com/language/ref/With.html)  call. First we define our handler (note that this is only a sample defintion):

	OFObjectMutationHandler~SetAttributes~HoldAllComplete;
	OFObjectMutationHandler[
	    Set[t : sym_Symbol?OFTestObjectQ[base___, prop : Except[_List]], 
	    newvalue_]
	    ] :=
	   With[{obj = sym[base]},
	     If[OFObjectQ[obj],
	       OFSet[obj, prop, newvalue]
	       ]
	     ];

And then we set it:

	Language`SetMutationHandler[OFObject, OFObjectMutationHandler];

And with that we can easily mutate our object with calls of the form:

	obj["prop"] = val

### Other Bits and Pieces

A number of other interface functions are implemented, including  ```AddTo``` ,  ```SubtractFrom``` ,  ```Join``` ,  ```Merge``` ,  ```Map```  etc.

Similarly, as is visible in the  ```OFPostLookup```  function, there is a special head called  ```OFMethod```  which binds to an object instance as a function and which can take an  ```Association```  as its second argument, which allows it to be treated as a python property in terms of auto-calling.

<a id="types" >&zwnj;</a>

## Types

### Creating Types

As noted previously, we’re treating types as objects, so we’ll need a way to construct new types as well. Note, though, that this will is much simpler than making objects, as they need not be initialized and don’t need unique keys.

	OFNewType[a : {__Association}] :=
	   Catch@
	    With[{
	       names =
	         Lookup[
	           a,
	           "ObjectTypeName"
	           ]
	       },
	      If[! AllTrue[names, StringQ], Message[OFNewType::names, names]; 
	     Throw@$Failed];
	      AssociateTo[
	        $OFObjectTable["Types"],
	        Thread[names -> a]
	        ]
	      ];

And again we’ll provide some more convenient, non-vectorized syntax:

	OFNewType[a_Association] :=
	   First@OFNewType[{a}];
	OFNewType[name_String, a : _Association : <||>] :=
	  OFNewType[
	    Append[a, "ObjectTypeName" -> name];
	    ]

### Type Instantiation

So we have an object creation syntax, but it’s worth having this be derivable from an  ```OFType```  as well. The simplest constructor would be simply to attach  [```SubValues```](https://www.wolframcloud.com/objects/b3m2a1.paclets/reference/ref/SubValues.html)  to the  ```OFType```  symbol:

	OFType[type_][args___] :=
	  OFNewObject[<|
	     "ObjectType" -> type,
	     "ObjectInitializationArguments" -> HoldComplete[args]
	     |>]

The issue is that  ```SubValues```  of course cannot have  [```Attributes```](https://reference.wolfram.com/language/ref/Attributes.html)  so we can’t hold the arguments, and we can’t vectorize this. So we’ll also build a more robust version, deviating from python syntax, using an  ```OFNewObject```  call:

	OFNewObject[types : {(Rule | RuleDelayed)[_OFType, _] ..}] :=
	   
	  OFNewObject[
	     <|
	         "ObjectType" ->
	           #[[1, 1]],
	         "ObjectInitializationArguments" ->
	           Extract[
	             #,
	             2,
	             Function[Null,
	               
	         Replace[HoldComplete[#], 
	          HoldComplete[_[a___]] :> HoldComplete[a]],
	               HoldAllComplete
	               ]
	             ]
	         |> & /@ types
	     ];
	OFNewObject[
	   types : {(Rule | RuleDelayed)[_OFType, _] | _OFType ..}] :=
	   
	  OFNewObject[
	     Replace[types, t_OFType :> (OFType -> {}), 1]
	     ];
	OFNewObject[type : (Rule | RuleDelayed)[_OFType, _] | _OFType] :=
	  
	 First@OFNewObject[{type}]

This way arguments can easily be specified using  [```RuleDelayed```](https://reference.wolfram.com/language/ref/RuleDelayed.html)  syntax to get holding, and it’s a clear, vectorizable syntax.

<a id="building-a-type-constructor" >&zwnj;</a>

## Building a Type Constructor

Having to specify a type as an  ```Association```  can be unwieldy, so we’ll build a package-like syntax for type definitions. The basic plan is to build and add to a construction stack until some end function is called, at which point it will unravel back out to a type.

### The Construction Stack

This is a simple list to which pieces can be appended. We’ll instantiate it like so:

	$OFConstructorStack = {};

### Begin

We’ll then create a function like  [```BeginPackage```](https://reference.wolfram.com/language/ref/BeginPackage.html)  which will stick basic meta-information on the stack:

	Options[OFBegin] = {
	    "Type" -> "Object",
	    "Construct" -> "Type",
	    "Assign" -> None
	    };
	OFBegin[name : Except[_Rule | _RuleDelayed], 
	   ops : OptionsPattern[]] :=
	   AppendTo[$OFConstructorStack,
	     <|
	       "Name" ->
	         Replace[name, None | Automatic :> CreateUUID["Type-"]],
	       "Construct" ->
	         Replace[OptionValue["Construct"], Except["Object"] -> "Type"],
	       "Assign" ->
	         OptionValue["Assign"],
	       "Fields" ->
	         <|
	           "ObjectType" ->
	             Replace[OptionValue["Type"],
	               _?(Not@KeyMemberQ[$OFObjectTable["Types"], #] &) -> 
	         "Object"
	               ]
	           |>,
	       "Methods" ->
	         <|
	           |>
	       |>
	     ];
	OFBegin~SetAttributes~HoldRest;

### Stack Additions

Then we have a function for sticking data on the stack. First one for fields:

	OFAddField[name_, value_] :=
	   (
	     AssociateTo[$OFConstructorStack[[-1, "Fields"]],
	        name -> value
	        ];
	     );
	OFAddFieldDelayed[name_, value_] :=
	   (
	     AssociateTo[$OFConstructorStack[[-1, "Fields"]],
	        name :> value
	        ];
	     );

And one for methods:

	OFAddMethod[nameProvided_, data : _Association : <||>] :=
	   
	  With[{name =
	       Replace[nameProvided,
	         s_String :>
	           Replace[
	             StringReplace[s, {
	                "__" ~~ l : WordCharacter .. ~~ "__" :>
	                  
	           "Object" <> ToUpperCase@StringTake[l, 1] <> 
	            StringDrop[l, 1],
	                "__" ~~ l : WordCharacter .. :> PrivateKey[l]
	                }],
	             StringExpression[__, p_PrivateKey] :> p
	             ]
	         ]},
	     If[KeyMemberQ[$OFConstructorStack[[-1, "Methods"]], name],
	       $OFConstructorStack[[-1, "Methods", name, "Properties"]] =
	         Join[
	           $OFConstructorStack[[-1, "Methods", name, "Properties"]],
	           data
	           ],
	       AssociateTo[$OFConstructorStack[[-1, "Methods"]],
	         name ->
	           <|
	             
	       "Symbol" -> OFMethodSymbol[name],
	             "Properties" -> data
	             |>
	         ]
	       ]
	     ];

Note that this uses something called  ```OFMethodSymbol```  which is defined like so:

	OFMethodSymbol[name_, add : True | False : False] :=
	   
	  If[KeyMemberQ[$OFConstructorStack[[-1, "Methods"]], name],
	     $OFConstructorStack[[-1, "Methods", name, "Symbol"]],
	     If[add,
	       OFAddMethod[name];
	       OFMethodSymbol[name, False],
	       Symbol[
	         StringReplace[ToString[name], 
	       Except[WordCharacter | "$"] -> ""] <>
	           "$" <> 
	      StringReplace[CreateUUID[], "-" -> ""]
	         ]
	       ]
	     ];

Where it simply finds the symbol attached to a method on the stack. This will be more important later.

### Method Construction

This constructor is more powerful if we provide a method construction aide or two, so we’ll do just that. First we’ll set up something to track what methods we build:

	If[! MatchQ[$OFBuiltMethods, _Association],
	   $OFBuiltMethods = <||>
	   ];

And then a function that actually builds a method:

	OFBuildMethod[f_, data_Association] :=
	  With[{
	     a = Lookup[data, "Attributes", {}],
	     o = Lookup[data, "Options", {}]
	     },
	    If[MatchQ[f, _Symbol],
	      Attributes[f] = a;
	      Options[f] = o;
	      ];
	    OFMethod[f, KeyDrop[data, {"Attributes", "Options"}]]
	    ]

### End

Finally we’ll have a function that takes all that stack data and converts it into a type. It simply finds all of the properties, puts them into the  ```Association```  that  ```OFNewType```  expects, and sends it through.

	OFEnd[] :=
	   If[Length@$OFConstructorStack > 0,
	     With[{a = Last@$OFConstructorStack},
	       $OFConstructorStack = Delete[$OFConstructorStack, -1];
	       With[{
	          t = a["Construct"],
	          s = a["Assign"],
	          n = a["Name"],
	          f = a["Fields"],
	          m = OFBuildMethod[#Symbol, #Properties] & /@ a["Methods"]
	          },
	         $OFBuiltMethods =
	           Join[$OFBuiltMethods,
	             AssociationMap[Null &,
	               Values@a[["Methods", All, "Symbol"]]
	               ]
	             ];
	         With[{obj =
	             If[t == "Type",
	               OFNewType[n, Join[f, m, <|"ObjectTypeName" -> n|>]];
	               OFType[n],
	               OFNewObject[Join[f, m, <|"ObjectType" -> n|>]]
	               ]
	            },
	           If[s =!= None, s = obj, s]
	           ]
	         ]
	       ],
	     None
	     ];

### Constructor UpValues

Generally we won’t want to use  ```OFAddField```  or anything like that when we’re defining types. It’s just a little bit clumsy. Better, generally, is to define types in a similar style to how packages are built. What I mean is we’ll want some syntax like this:

	OFBegin["TypeName"];
	OFField["FieldName"] = val;
	SetOptions[OFMethod["MethodName"], { ...}];
	OFMethod["MethodName"][pats___] := code;
	OFEnd[];

We can get set this up using  ```UpValues``` . The actually  ```UpValues```  used aren’t terribly interesting so we’ll leave them out here. You can look at the implementation package if you’re interested.

### Magic Methods

One last thing we’ll want are aliases for some so-called “magic methods”—things like  ```"ObjectInitialization"```  that the framework knows to look for and which define special hooks. At the moment there are three of these:

	OFInit /:
	   
	  HoldPattern[(s : Set | SetDelayed)[OFInit[p___], code_]] :=
	    
	  s[OFMethod["ObjectInitialization"][p], code];
	OFRepr /:
	   
	  HoldPattern[(s : Set | SetDelayed)[OFRepr[p___], code_]] :=
	    
	  s[OFMethod["ObjectRepresentation"][p], code];
	OFStr /:
	   
	  HoldPattern[(s : Set | SetDelayed)[OFStr[p___], code_]] :=
	    
	  s[OFMethod["ObjectString"][p], code];

<a id="an-object-framework-example" >&zwnj;</a>

# An Object Framework Example

<a id="defining-a-ball-in-a-box" >&zwnj;</a>

## Defining a Ball in a Box

We’ll do a quick, simple example, where we define a ball-in-a-box class and just watch a ball bounce around a box:

First we begin the class:

	ballInABox := OFBegin["BallInABox"]

	(*Out:*)
	
	{<|"Name" -> "BallInABox", "Construct" -> "Type", 
	  "Assign" -> HoldPattern[ballInABox], 
	  "Fields" -> <|"ObjectType" -> "Object"|>, "Methods" -> <||>|>}

Add a default box and elasticity multiplier

```lang-mathematica
OFField["Box"] = { {-5, 5}, {-5, 5} };
OFField["ElasticityMultiplier"] = 1;
```

Define a  ```"Step"```  function

	OFMethod["Step"][
	   self_,
	   time : _Quantity : Quantity[.1, "Seconds"],
	   steps : _Integer?Positive : 1
	   ] :=
	  
	 Module[{position, velocity, box, mulp, 
	   timenum = QuantityMagnitude@UnitConvert[time, "Seconds"]}, 
	    {position, velocity, box, mulp} =
	      OFLookup[
	    self, {"Position", "Velocity", "Box", "ElasticityMultiplier"}];
	    (self[{"Postion", "Velocity"}] = {position, velocity}; #) &@
	      Reap[
	         Do[
	           position += velocity*timenum;
	           Which[
	             position[[1]] < box[[1, 1]],
	              position[[1]] = box[[1, 1]];
	              velocity[[1]] = -mulp*velocity[[1]],
	             position[[1]] > box[[1, 2]],
	              position[[1]] = box[[1, 2]];
	              velocity[[1]] = -mulp*velocity[[1]]
	             ];
	           Which[
	             position[[2]] < box[[2, 1]],
	              position[[2]] = box[[2, 1]];
	              velocity[[2]] = -mulp*velocity[[2]],
	             position[[2]] > box[[2, 2]],
	              position[[2]] = box[[2, 2]];
	              velocity[[2]] = -mulp*velocity[[2]]
	             ];
	           Sow@position,
	           steps
	           ]
	         ][[2, 1]]
	    ]

Then we end define the constructor:

	OFInit[self_,
	   position : {_?NumericQ, _?NumericQ} : {0, 0},
	   velocity : {_?NumericQ, _?NumericQ} : {1, 1}
	   ] :=
	  
	 OFSetThread[self, {"Position", "Velocity"}, {position, velocity}]

And let’s just peek at the stack:

	$OFConstructorStack

	(*Out:*)
	
	{<|"Name" -> "BallInABox", "Construct" -> "Type", 
	  "Assign" -> HoldPattern[ballInABox], 
	  "Fields" -> <|"ObjectType" -> "Object", "Box" -> { {-5, 5}, {-5, 5} },
	     "ElasticityMultiplier" -> 1|>, 
	  "Methods" -> <|"Step" -> <|"Symbol" -> 
	       Step$22f15d87fd684683a13e88d69f21dad4, "Properties" -> <||>|>, 
	    "ObjectInitialization" -> <|"Symbol" -> 
	       ObjectInitialization$4a5647db29784ae69d9b1f0dcd88cddb, 
	      "Properties" -> <||>|>|>|>}

	OFEnd[]

	(*Out:*)
	
 ![posts-a-fake-object-framework-5533752296471534441]({{site.base_url}}/img/posts-a-fake-object-framework-5533752296471534441.png)

<a id="playing-with-a-ballinabox" >&zwnj;</a>

## Playing with a ball-in-a-box

We’ll then just build one of these objects:

	ball = ballInABox[RandomReal[{-5, 5}, 2], RandomReal[{-2.5, 2.5}, 2]]

	(*Out:*)
	
 ![posts-a-fake-object-framework-9116754826795747734]({{site.base_url}}/img/posts-a-fake-object-framework-9116754826795747734.png)

And make it step like 10 times

	ball["Step"][10]

	(*Out:*)
	
	{ {3.08519, 
	  0.0352382}, {3.21787, -0.0303612}, {3.35055, -0.0959607}, {3.48323, \
	-0.16156}, {3.61591, -0.22716}, {3.74859, -0.292759}, {3.88127, \
	-0.358359}, {4.01394, -0.423958}, {4.14662, -0.489558}, {4.2793, \
	-0.555157} }

Check the ball’s position and velocity:

	ball[{"Position", "Velocity"}]

	(*Out:*)
	
	{ {2.95251, 0.100838}, {1.32679, -0.655995} }

And view the ball bouncing:

	With[{box = ball["Box"]},
	  ListAnimate[
	    Graphics[Point[#], PlotRange -> box] & /@ ball["Step"][100]
	    ]
	  ]

	(*Out:*)
	
 ![posts-a-fake-object-framework-3943164318078536356]({{site.base_url}}/img/posts-a-fake-object-framework-3943164318078536356.gif)

Randomize the position and velocity and do it again, but faster

	ball[{"Position", "Velocity"}] = {RandomReal[{-5, 5}, 2], 
	   RandomReal[{-2.5, 2.5}, 2]};
	With[{box = ball["Box"]},
	  ListAnimate[
	    Graphics[Point[#], PlotRange -> box] & /@ 
	   ball["Step"][Quantity[2, "Seconds"], 100]
	    ]
	  ]

	(*Out:*)
	
 ![posts-a-fake-object-framework-6727523626926870660]({{site.base_url}}/img/posts-a-fake-object-framework-6727523626926870660.gif)

This is a basic example of the sort of thing OOP brings to the table and, with enough work, it’s pretty fast and nice enough to work with.

declare namespace CS {
    // const __keep_incompatibility: unique symbol;
    // 
    // interface $Ref<T> {
    //     value: T
    // }
    // namespace System {
    //     interface Array$1<T> extends System.Array {
    //         get_Item(index: number):T;
    //         
    //         set_Item(index: number, value: T):void;
    //     }
    // }
    // interface $Task<T> {}
    namespace System {
        class Object
        {
            protected [__keep_incompatibility]: never;
        }
        class ValueType extends System.Object
        {
            protected [__keep_incompatibility]: never;
        }
        class Single extends System.ValueType implements System.IEquatable$1<number>, System.IFormattable, System.ISpanFormattable, System.IComparable, System.IComparable$1<number>, System.IConvertible
        {
            protected [__keep_incompatibility]: never;
        }
        interface IEquatable$1<T>
        {
        }
        interface IFormattable
        {
        }
        interface ISpanFormattable
        {
        }
        interface IComparable
        {
        }
        interface IComparable$1<T>
        {
        }
        interface IConvertible
        {
        }
        class Void extends System.ValueType
        {
            protected [__keep_incompatibility]: never;
        }
        class Delegate extends System.Object implements System.ICloneable, System.Runtime.Serialization.ISerializable
        {
            protected [__keep_incompatibility]: never;
        }
        interface ICloneable
        {
        }
        interface MulticastDelegate
        { 
        (...args:any[]) : any; 
        Invoke?: (...args:any[]) => any;
        }
        var MulticastDelegate: { new (func: (...args:any[]) => any): MulticastDelegate; }
        interface Action$1<T>
        { 
        (obj: T) : void; 
        Invoke?: (obj: T) => void;
        }
        class Int32 extends System.ValueType implements System.IEquatable$1<number>, System.IFormattable, System.ISpanFormattable, System.IComparable, System.IComparable$1<number>, System.IConvertible
        {
            protected [__keep_incompatibility]: never;
        }
        class Array extends System.Object implements System.Collections.IEnumerable, System.ICloneable, System.Collections.IList, System.Collections.IStructuralComparable, System.Collections.IStructuralEquatable, System.Collections.ICollection
        {
            protected [__keep_incompatibility]: never;
        }
    }
    namespace UnityEngine {
        /** Base class for all objects Unity can reference.
        */
        class Object extends System.Object
        {
            protected [__keep_incompatibility]: never;
        }
        /** Base class for everything attached to a GameObject.
        */
        class Component extends UnityEngine.Object
        {
            protected [__keep_incompatibility]: never;
        }
        /** Behaviours are Components that can be enabled or disabled.
        */
        class Behaviour extends UnityEngine.Component
        {
            protected [__keep_incompatibility]: never;
        }
        /** MonoBehaviour is a base class that many Unity scripts derive from.
        */
        class MonoBehaviour extends UnityEngine.Behaviour
        {
            protected [__keep_incompatibility]: never;
        }
    }
    namespace OneJS.Samples {
        class SampleCharacter extends UnityEngine.MonoBehaviour
        {
            protected [__keep_incompatibility]: never;
            public get Health(): number;
            public set Health(value: number);
            public get MaxHealth(): number;
            public set MaxHealth(value: number);
            public get SlotIndex(): number;
            public set SlotIndex(value: number);
            public add_OnHealthChanged ($value: System.Action$1<number>) : void
            public remove_OnHealthChanged ($value: System.Action$1<number>) : void
            public add_OnMaxHealthChanged ($value: System.Action$1<number>) : void
            public remove_OnMaxHealthChanged ($value: System.Action$1<number>) : void
            public add_OnSlotIndexChanged ($value: System.Action$1<number>) : void
            public remove_OnSlotIndexChanged ($value: System.Action$1<number>) : void
            public constructor ()
        }
    }
    namespace System.Runtime.Serialization {
        interface ISerializable
        {
        }
    }
    namespace System.Collections {
        interface IEnumerable
        {
        }
        interface IList extends System.Collections.IEnumerable, System.Collections.ICollection
        {
        }
        interface ICollection extends System.Collections.IEnumerable
        {
        }
        interface IStructuralComparable
        {
        }
        interface IStructuralEquatable
        {
        }
    }
}

declare const sam: CS.OneJS.Samples.SampleCharacter;

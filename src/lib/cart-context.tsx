"use client";

import { createContext, useContext, useReducer } from "react";

export interface CartItem {
    id: string;
    name: string;
    description?: string;
    price: number;
    quantity: number;
}

interface CartState {
    items: CartItem[];
    total: number;
}

type CartAction =
    | { type: "ADD_ITEM"; item: CartItem }
    | { type: "REMOVE_ITEM"; id: string }
    | { type: "UPDATE_QUANTITY"; id: string; quantity: number }
    | { type: "CLEAR_CART" };

interface CartContextType {
    state: CartState;
    dispatch: React.Dispatch<CartAction>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function calculateTotal(items: CartItem[]): number {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function cartReducer(state: CartState, action: CartAction): CartState {
    switch (action.type) {
        case "ADD_ITEM": {
            const existingItem = state.items.find(item => item.id === action.item.id);
            if (existingItem) {
                const updatedItems = state.items.map(item =>
                    item.id === action.item.id
                        ? { ...item, quantity: item.quantity + action.item.quantity }
                        : item
                );
                return {
                    items: updatedItems,
                    total: calculateTotal(updatedItems),
                };
            }
            const updatedItems = [...state.items, action.item];
            return {
                items: updatedItems,
                total: calculateTotal(updatedItems),
            };
        }
        case "REMOVE_ITEM": {
            const updatedItems = state.items.filter(item => item.id !== action.id);
            return {
                items: updatedItems,
                total: calculateTotal(updatedItems),
            };
        }
        case "UPDATE_QUANTITY": {
            const updatedItems = state.items.map(item =>
                item.id === action.id
                    ? { ...item, quantity: action.quantity }
                    : item
            );
            return {
                items: updatedItems,
                total: calculateTotal(updatedItems),
            };
        }
        case "CLEAR_CART":
            return {
                items: [],
                total: 0,
            };
        default:
            return state;
    }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(cartReducer, {
        items: [],
        total: 0,
    });

    return (
        <CartContext.Provider value={{ state, dispatch }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
} 
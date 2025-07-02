"use client";

import { createContext, useContext, useReducer } from "react";
import type { ReactNode } from "react";

interface CartItem {
    productId: string;
    variant: string;
    quantity: number;
    title: string;
    price: number;
}

interface CartState {
    items: CartItem[];
    total: number;
}

type CartAction =
    | { type: "ADD_ITEM"; payload: CartItem }
    | { type: "REMOVE_ITEM"; payload: { productId: string; variant: string } }
    | { type: "UPDATE_QUANTITY"; payload: { productId: string; variant: string; quantity: number } }
    | { type: "CLEAR_CART" };

const CartContext = createContext<{
    state: CartState;
    dispatch: React.Dispatch<CartAction>;
} | null>(null);

const cartReducer = (state: CartState, action: CartAction): CartState => {
    switch (action.type) {
        case "ADD_ITEM": {
            const existingItemIndex = state.items.findIndex(
                item => item.productId === action.payload.productId && item.variant === action.payload.variant
            );

            let newItems;
            if (existingItemIndex > -1) {
                newItems = state.items.map((item, index) =>
                    index === existingItemIndex
                        ? { ...item, quantity: item.quantity + action.payload.quantity }
                        : item
                );
            } else {
                newItems = [...state.items, action.payload];
            }

            return {
                items: newItems,
                total: newItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
            };
        }

        case "REMOVE_ITEM": {
            const newItems = state.items.filter(
                item => !(item.productId === action.payload.productId && item.variant === action.payload.variant)
            );
            return {
                items: newItems,
                total: newItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
            };
        }

        case "UPDATE_QUANTITY": {
            const newItems = state.items.map(item =>
                item.productId === action.payload.productId && item.variant === action.payload.variant
                    ? { ...item, quantity: action.payload.quantity }
                    : item
            );
            return {
                items: newItems,
                total: newItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
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
};

export function CartProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(cartReducer, { items: [], total: 0 });

    return (
        <CartContext.Provider value={{ state, dispatch }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
} 
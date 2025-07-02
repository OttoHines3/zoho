"use client";

import { Fragment } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./button";
import { useCart } from "~/lib/cart-context";

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
    const router = useRouter();
    const { state, dispatch } = useCart();

    const handleRemoveItem = (id: string) => {
        dispatch({ type: "REMOVE_ITEM", id });
    };

    const handleUpdateQuantity = (id: string, quantity: number) => {
        if (quantity < 1) {
            handleRemoveItem(id);
            return;
        }
        dispatch({ type: "UPDATE_QUANTITY", id, quantity });
    };

    return (
        <div
            className={`fixed inset-0 z-50 ${isOpen ? "block" : "hidden"}`}
            role="dialog"
            aria-modal="true"
        >
            {/* Background overlay */}
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

            {/* Sliding panel */}
            <div className="fixed inset-y-0 right-0 flex max-w-full">
                <div className={`w-screen max-w-md transform transition-transform duration-500 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
                    <div className="flex h-full flex-col bg-white shadow-xl">
                        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                            <div className="flex items-start justify-between">
                                <h2 className="text-lg font-medium text-gray-900">Shopping cart</h2>
                                <div className="ml-3 flex h-7 items-center">
                                    <button
                                        type="button"
                                        className="relative -m-2 p-2 text-gray-400 hover:text-gray-500"
                                        onClick={onClose}
                                    >
                                        <span className="absolute -inset-0.5" />
                                        <span className="sr-only">Close panel</span>
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className="mt-8">
                                <div className="flow-root">
                                    <ul role="list" className="-my-6 divide-y divide-gray-200">
                                        {state.items.map((item) => (
                                            <li key={item.id} className="flex py-6">
                                                <div className="flex-1">
                                                    <div className="flex justify-between text-base font-medium text-gray-900">
                                                        <h3>{item.name}</h3>
                                                        <p className="ml-4">${(item.price * item.quantity).toFixed(2)}</p>
                                                    </div>
                                                    {item.description && (
                                                        <p className="mt-1 text-sm text-gray-500">{item.description}</p>
                                                    )}
                                                    <div className="flex items-center mt-2">
                                                        <button
                                                            type="button"
                                                            className="text-gray-500 hover:text-gray-600 px-2 py-1 border rounded"
                                                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                                        >
                                                            -
                                                        </button>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={item.quantity}
                                                            onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                                                            className="mx-2 w-16 text-center border rounded"
                                                        />
                                                        <button
                                                            type="button"
                                                            className="text-gray-500 hover:text-gray-600 px-2 py-1 border rounded"
                                                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                                        >
                                                            +
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="ml-4 text-red-600 hover:text-red-500"
                                                            onClick={() => handleRemoveItem(item.id)}
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
                            <div className="flex justify-between text-base font-medium text-gray-900">
                                <p>Subtotal</p>
                                <p>${state.total.toFixed(2)}</p>
                            </div>
                            <p className="mt-0.5 text-sm text-gray-500">
                                Shipping and taxes calculated at checkout.
                            </p>
                            <div className="mt-6">
                                <Button
                                    onClick={() => {
                                        router.push("/checkout");
                                        onClose();
                                    }}
                                    disabled={state.items.length === 0}
                                    className="w-full"
                                >
                                    Checkout
                                </Button>
                            </div>
                            <div className="mt-6 flex justify-center text-center text-sm text-gray-500">
                                <p>
                                    or{" "}
                                    <button
                                        type="button"
                                        className="font-medium text-black hover:text-gray-800"
                                        onClick={() => {
                                            dispatch({ type: "CLEAR_CART" });
                                            onClose();
                                        }}
                                    >
                                        Clear Cart
                                    </button>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 
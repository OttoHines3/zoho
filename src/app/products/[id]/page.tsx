"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Minus, Plus } from "lucide-react";
import { useCart } from "~/lib/cart-context";

interface ProductVariant {
    id: string;
    name: string;
    price: number;
}

// This would typically come from your database
const PRODUCT_DATA = {
    "basic-integration": {
        title: "Basic Integration",
        description: "Essential Zoho CRM integration with basic automation features",
        basePrice: 499.99,
        variants: [
            { id: "basic-monthly", name: "Monthly Subscription", price: 499.99 },
            { id: "basic-yearly", name: "Yearly Subscription (Save 20%)", price: 4799.99 },
        ],
    },
    "professional-suite": {
        title: "Professional Suite",
        description: "Advanced integration with workflow automation and custom fields",
        basePrice: 999.00,
        variants: [
            { id: "pro-monthly", name: "Monthly Subscription", price: 999.99 },
            { id: "pro-yearly", name: "Yearly Subscription (Save 20%)", price: 9599.99 },
        ],
    },
    "enterprise-package": {
        title: "Enterprise Package",
        description: "Complete integration solution with advanced analytics and API access",
        basePrice: 1499.00,
        variants: [
            { id: "enterprise-monthly", name: "Monthly Subscription", price: 1499.99 },
            { id: "enterprise-yearly", name: "Yearly Subscription (Save 20%)", price: 14399.99 },
        ],
    },
};

export default function ProductPage() {
    const params = useParams();
    const productId = params.id as string;
    const [selectedVariant, setSelectedVariant] = useState<string>("");
    const [quantity, setQuantity] = useState(1);
    const { dispatch } = useCart();

    const product = PRODUCT_DATA[productId as keyof typeof PRODUCT_DATA];

    // Set default variant when product loads
    useEffect(() => {
        if (product?.variants && product.variants.length > 0) {
            setSelectedVariant(product.variants[0].id);
        }
    }, [product]);

    if (!product) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="p-6">
                    <h1 className="text-xl font-semibold mb-2">Product Not Found</h1>
                    <p className="text-gray-600">The requested product could not be found.</p>
                </Card>
            </div>
        );
    }

    const handleQuantityChange = (change: number) => {
        const newQuantity = quantity + change;
        if (newQuantity >= 1) {
            setQuantity(newQuantity);
        }
    };

    const addToCart = () => {
        if (!selectedVariant) {
            console.log("No variant selected");
            return;
        }

        const variant = product.variants.find(v => v.id === selectedVariant);
        if (!variant) {
            console.log("Variant not found:", selectedVariant);
            return;
        }

        console.log("Adding to cart:", {
            productId,
            variant: selectedVariant,
            quantity,
            title: product.title,
            price: variant.price,
        });

        dispatch({
            type: "ADD_ITEM",
            payload: {
                productId,
                variant: selectedVariant,
                quantity,
                title: product.title,
                price: variant.price,
            },
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Product Image */}
                    <div className="bg-white rounded-lg p-8 flex items-center justify-center">
                        <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                            <span className="text-gray-400">Product Image</span>
                        </div>
                    </div>

                    {/* Product Details */}
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{product.title}</h1>
                            <p className="text-lg text-gray-600 mt-2">{product.description}</p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                ${selectedVariant
                                    ? product.variants.find(v => v.id === selectedVariant)?.price
                                    : product.basePrice}
                            </h2>
                        </div>

                        {/* Product Variants */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-900 mb-4">Subscription Options</h3>
                            <div className="space-y-2">
                                {product.variants.map((variant) => (
                                    <label
                                        key={variant.id}
                                        className={`block p-4 rounded-lg border cursor-pointer transition-colors ${selectedVariant === variant.id
                                            ? "border-purple-600 bg-purple-50"
                                            : "border-gray-200 hover:border-purple-200"
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="variant"
                                            value={variant.id}
                                            checked={selectedVariant === variant.id}
                                            onChange={(e) => setSelectedVariant(e.target.value)}
                                            className="sr-only"
                                        />
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium">{variant.name}</span>
                                            <span className="text-gray-900">${variant.price}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Quantity Selector */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-900 mb-4">Quantity</h3>
                            <div className="flex items-center space-x-4">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleQuantityChange(-1)}
                                    disabled={quantity <= 1}
                                >
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <span className="text-lg font-medium w-12 text-center">{quantity}</span>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleQuantityChange(1)}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Add to Cart Button */}
                        <Button
                            className="w-full bg-black text-white hover:bg-gray-800"
                            size="lg"
                            onClick={addToCart}
                            disabled={!selectedVariant}
                        >
                            Add To Cart
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
} 
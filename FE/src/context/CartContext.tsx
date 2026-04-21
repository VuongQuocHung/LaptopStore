"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { Product } from "@/types/api";
import { useAuth } from "@/context/AuthContext";

export interface CartItem {
  id: number;
  product: Product;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]); // ds sản phẩm trong giỏ hàng
  const [loadedCartKey, setLoadedCartKey] = useState<string | null>(null);

  const cartStorageKey = useMemo(() => {
    const normalizedEmail = user?.email?.trim().toLowerCase();
    return normalizedEmail ? `cart:${normalizedEmail}` : "cart:guest";
  }, [user?.email]);

  useEffect(() => {
    const savedCart = localStorage.getItem(cartStorageKey);
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch {
        localStorage.removeItem(cartStorageKey);
        setCart([]);
      }
    } else {
      setCart([]);
    }

    setLoadedCartKey(cartStorageKey);
  }, [cartStorageKey]);

  useEffect(() => {
    if (loadedCartKey !== cartStorageKey) return;
    localStorage.setItem(cartStorageKey, JSON.stringify(cart));
  }, [cart, loadedCartKey, cartStorageKey]);

  const addToCart = (product: Product, quantity = 1) => {
    if (!product.id) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { id: product.id!, product, quantity }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce(
    (sum, item) => sum + (item.product.price || 0) * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
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

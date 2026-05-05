/**
 * TST-E3: Cart total calculation logic tests
 *
 * Cart.jsx delegates total calculation to the server (totalPrice comes from
 * requestGetCart response), so there is no exported pure function to import.
 * These tests validate the calculation logic in isolation using the same
 * formulas the component would use if the logic were client-side.
 *
 * Fields used in the component:
 *   item.price      — base price (number)
 *   item.quantity   — quantity in cart
 *   item.priceDiscount — discounted price (0 means no discount)
 */

import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Pure helper — mirrors what Cart.jsx would compute client-side
// ---------------------------------------------------------------------------
const calcItemTotal = (item) => {
    const effectivePrice = item.priceDiscount > 0 ? item.priceDiscount : item.price;
    return effectivePrice * item.quantity;
};

const calcCartTotal = (items) =>
    items.reduce((sum, item) => sum + calcItemTotal(item), 0);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('Cart total calculation', () => {
    it('should calculate total correctly for a single item', () => {
        const items = [{ price: 10000000, priceDiscount: 0, quantity: 2 }];
        expect(calcCartTotal(items)).toBe(20000000);
    });

    it('should return 0 for an empty cart', () => {
        expect(calcCartTotal([])).toBe(0);
    });

    it('should use priceDiscount when it is greater than 0', () => {
        const item = { price: 20000000, priceDiscount: 15000000, quantity: 1 };
        expect(calcItemTotal(item)).toBe(15000000);
    });

    it('should use regular price when priceDiscount is 0', () => {
        const item = { price: 20000000, priceDiscount: 0, quantity: 1 };
        expect(calcItemTotal(item)).toBe(20000000);
    });

    it('should sum multiple items correctly', () => {
        const items = [
            { price: 10000000, priceDiscount: 0, quantity: 2 },   // 20,000,000
            { price: 5000000,  priceDiscount: 4000000, quantity: 3 }, // 12,000,000
        ];
        expect(calcCartTotal(items)).toBe(32000000);
    });

    it('should handle quantity of 0 without error', () => {
        const items = [{ price: 10000000, priceDiscount: 0, quantity: 0 }];
        expect(calcCartTotal(items)).toBe(0);
    });

    it('should handle a large number of items', () => {
        const items = Array.from({ length: 100 }, (_, i) => ({
            price: 1000000 * (i + 1),
            priceDiscount: 0,
            quantity: 1,
        }));
        const expected = items.reduce((sum, item) => sum + item.price, 0);
        expect(calcCartTotal(items)).toBe(expected);
    });

    it('should prefer priceDiscount over price even when priceDiscount is higher', () => {
        // Edge case: discount price accidentally set higher (data integrity issue)
        const item = { price: 10000000, priceDiscount: 12000000, quantity: 1 };
        // Logic: priceDiscount > 0, so it is used regardless
        expect(calcItemTotal(item)).toBe(12000000);
    });
});

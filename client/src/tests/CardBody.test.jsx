/**
 * TST-E2: CardBody component tests
 *
 * CardBody is a relatively clean component:
 *   - Accepts an `item` prop (product object)
 *   - Uses react-router-dom <Link> for navigation
 *   - Uses classnames + SCSS module (handled by Vitest jsdom)
 *   - Shows priceDiscount when > 0, otherwise shows regular price
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CardBody from '../Components/CardBody/CardBody';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const renderCardBody = (props = {}) =>
    render(
        <MemoryRouter>
            <CardBody {...props} />
        </MemoryRouter>,
    );

const sampleItem = {
    _id: 'prod-001',
    name: 'Laptop Gaming ASUS ROG',
    price: 25000000,
    priceDiscount: 0,
    images: ['https://example.com/asus-rog.jpg'],
};

const sampleItemWithDiscount = {
    _id: 'prod-002',
    name: 'MacBook Pro M3',
    price: 40000000,
    priceDiscount: 35000000,
    images: ['https://example.com/macbook.jpg'],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('CardBody', () => {
    it('renders a loading placeholder when no item is provided', () => {
        renderCardBody();
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('renders the product name', () => {
        renderCardBody({ item: sampleItem });
        expect(screen.getByText('Laptop Gaming ASUS ROG')).toBeInTheDocument();
    });

    it('renders the product price when there is no discount', () => {
        renderCardBody({ item: sampleItem });
        // price 25,000,000 formatted with toLocaleString + "đ"
        expect(screen.getByText(/25[,.]000[,.]000đ/)).toBeInTheDocument();
    });

    it('does NOT render a discounted price when priceDiscount is 0', () => {
        renderCardBody({ item: sampleItem });
        // When priceDiscount === 0, the component renders a single <p> with the regular price
        // There should be no separate "price-new" element
        const allPriceEls = screen.getAllByText(/đ/);
        // Only one price element should be visible
        expect(allPriceEls).toHaveLength(1);
    });

    it('renders both original and discounted prices when priceDiscount > 0', () => {
        renderCardBody({ item: sampleItemWithDiscount });
        // Original price: 40,000,000đ
        expect(screen.getByText(/40[,.]000[,.]000đ/)).toBeInTheDocument();
        // Discounted price: 35,000,000đ
        expect(screen.getByText(/35[,.]000[,.]000đ/)).toBeInTheDocument();
    });

    it('renders a link to the product detail page', () => {
        renderCardBody({ item: sampleItem });
        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', '/product/prod-001');
    });

    it('renders the product image with the first image URL', () => {
        const { container } = renderCardBody({ item: sampleItem });
        // alt="" makes the img decorative (presentation role) — query by tag instead
        const img = container.querySelector('img');
        expect(img).toHaveAttribute('src', 'https://example.com/asus-rog.jpg');
    });

    it('renders the compare button when checkSelectCompare is true', () => {
        const handleCompare = vi.fn();
        renderCardBody({
            item: sampleItem,
            checkSelectCompare: true,
            handleCompare,
        });
        const compareBtn = screen.getByRole('button', { name: /so sánh/i });
        expect(compareBtn).toBeInTheDocument();
    });

    it('does NOT render the compare button when checkSelectCompare is false', () => {
        renderCardBody({ item: sampleItem, checkSelectCompare: false });
        expect(screen.queryByRole('button', { name: /so sánh/i })).toBeNull();
    });
});

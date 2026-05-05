/**
 * TST-E1: LoginUser component tests
 *
 * LoginUser has heavy dependencies:
 *   - @react-oauth/google (GoogleOAuthProvider / GoogleLogin)
 *   - antd (Input, Button, Space, message)
 *   - react-router-dom (Link, useNavigate)
 *   - Header / Footer sub-components (which pull in their own dep trees)
 *   - requestLogin / requestLoginGoogle from Config/request (Axios)
 *
 * Strategy:
 *   - Mock the heavy third-party packages at the module level
 *   - Mock Config/request to prevent real HTTP calls
 *   - Wrap in MemoryRouter so useNavigate / Link resolve
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Module mocks — must be declared before the component import
// ---------------------------------------------------------------------------

// Mock Header and Footer to avoid their complex dep chains
vi.mock('../Components/Header/Header', () => ({
    default: () => <div data-testid="mock-header" />,
}));
vi.mock('../Components/Footer/Footer', () => ({
    default: () => <div data-testid="mock-footer" />,
}));

// Mock Google OAuth — renders nothing, avoids script loading
vi.mock('@react-oauth/google', () => ({
    GoogleOAuthProvider: ({ children }) => <>{children}</>,
    GoogleLogin: () => <button data-testid="google-login-btn">Google</button>,
}));

// Mock request helpers — prevent real Axios calls
vi.mock('../Config/request', () => ({
    requestLogin: vi.fn(),
    requestLoginGoogle: vi.fn(),
}));

// Mock antd message to avoid console noise in tests
vi.mock('antd', async (importOriginal) => {
    const antd = await importOriginal();
    return {
        ...antd,
        message: {
            success: vi.fn(),
            error: vi.fn(),
        },
    };
});

// ---------------------------------------------------------------------------
// Import component AFTER mocks are in place
// ---------------------------------------------------------------------------
import LoginUser from '../Pages/LoginUser/LoginUser';
import { requestLogin } from '../Config/request';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const renderLoginUser = () =>
    render(
        <MemoryRouter>
            <LoginUser />
        </MemoryRouter>,
    );

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('LoginUser', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render without crashing', () => {
        const { container } = renderLoginUser();
        expect(container).toBeTruthy();
    });

    it('renders an email input field', () => {
        renderLoginUser();
        // antd Input renders a native <input> element
        const inputs = screen.getAllByRole('textbox');
        expect(inputs.length).toBeGreaterThanOrEqual(1);
    });

    it('renders a password input field', () => {
        renderLoginUser();
        // antd Input.Password renders type="password"
        const passwordInput = document.querySelector('input[type="password"]');
        expect(passwordInput).not.toBeNull();
    });

    it('renders the login submit button', () => {
        renderLoginUser();
        const loginButton = screen.getByRole('button', { name: /đăng nhập/i });
        expect(loginButton).toBeInTheDocument();
    });

    it('renders a link to the register page', () => {
        renderLoginUser();
        const registerLink = screen.getByRole('link', { name: /đăng ký/i });
        expect(registerLink).toBeInTheDocument();
        expect(registerLink).toHaveAttribute('href', '/register');
    });

    it('renders a link to the forgot-password page', () => {
        renderLoginUser();
        const forgotLink = screen.getByRole('link', { name: /quên mật khẩu/i });
        expect(forgotLink).toBeInTheDocument();
        expect(forgotLink).toHaveAttribute('href', '/forgot-password');
    });

    it('calls requestLogin with email and password when submit button is clicked', async () => {
        requestLogin.mockResolvedValueOnce({ metadata: { message: 'OK' } });

        renderLoginUser();

        const emailInput = screen.getAllByRole('textbox')[0];
        const passwordInput = document.querySelector('input[type="password"]');
        const loginButton = screen.getByRole('button', { name: /đăng nhập/i });

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'secret123' } });
        fireEvent.click(loginButton);

        // requestLogin should have been called once
        expect(requestLogin).toHaveBeenCalledTimes(1);
        expect(requestLogin).toHaveBeenCalledWith({
            email: 'test@example.com',
            password: 'secret123',
        });
    });

    it.todo('email format validation — Phase 2: antd does not add native validation; requires custom validator logic');
});

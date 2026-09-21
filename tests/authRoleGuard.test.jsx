import React, { act } from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../src/components/ProtectedRoute.jsx';
import Header from '../src/components/Header.jsx';

describe('Login Prerequisite and Role Separation', () => {
  let container;
  let root;

  beforeEach(() => {
    localStorage.clear();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('redirects to /login when unauthenticated', async () => {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute allowedRole="user">
                  <div>Main Customer Window</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Demo Login Gatekeeper</div>} />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(container.textContent).toContain('Demo Login Gatekeeper');
    expect(container.textContent).not.toContain('Main Customer Window');
  });

  it('blocks Customer (User) from accessing Worker section (manage/plans/join)', async () => {
    localStorage.setItem(
      'ezyfix_demo_session',
      JSON.stringify({
        name: 'Adhil Dev',
        place: 'Kaloor',
        userId: 'USR-8092',
        role: 'user',
        authenticated: true,
      })
    );

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/manage']}>
          <Routes>
            <Route
              path="/manage"
              element={
                <ProtectedRoute allowedRole="worker">
                  <div>Worker Dashboard Content</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(container.textContent).toContain('Worker Section Only');
    expect(container.textContent).toContain('Access Restricted');
    expect(container.textContent).toContain('customers cannot access worker tools');
    expect(container.textContent).not.toContain('Worker Dashboard Content');
  });

  it('blocks Worker from accessing Customer directory section', async () => {
    localStorage.setItem(
      'ezyfix_demo_session',
      JSON.stringify({
        name: 'Jomon K',
        place: 'Kaloor',
        userId: 'WRK-4011',
        role: 'worker',
        authenticated: true,
      })
    );

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute allowedRole="user">
                  <div>Customer Directory Content</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(container.textContent).toContain('Customer Section Only');
    expect(container.textContent).toContain('Access Restricted');
    expect(container.textContent).toContain('workers cannot browse the customer directory');
    expect(container.textContent).not.toContain('Customer Directory Content');
  });

  it('allows Customer to access Customer section and Header hides worker links', async () => {
    localStorage.setItem(
      'ezyfix_demo_session',
      JSON.stringify({
        name: 'Adhil Dev',
        place: 'Kaloor',
        userId: 'USR-8092',
        role: 'user',
        authenticated: true,
      })
    );

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/']}>
          <Header />
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute allowedRole="user">
                  <div>Customer Directory Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(container.textContent).toContain('Customer Directory Content');
    expect(container.textContent).toContain('Find Pros');
    expect(container.textContent).toContain('Adhil');
    expect(container.textContent).toContain('User');
    // Worker links should NOT be shown
    expect(container.textContent).not.toContain('Dashboard');
    expect(container.textContent).not.toContain('Plans');
    expect(container.textContent).not.toContain('Join');
  });

  it('allows Worker to access Worker section and Header hides customer links', async () => {
    localStorage.setItem(
      'ezyfix_demo_session',
      JSON.stringify({
        name: 'Jomon K',
        place: 'Kaloor',
        userId: 'WRK-4011',
        role: 'worker',
        authenticated: true,
      })
    );

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/manage']}>
          <Header />
          <Routes>
            <Route
              path="/manage"
              element={
                <ProtectedRoute allowedRole="worker">
                  <div>Worker Dashboard Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(container.textContent).toContain('Worker Dashboard Content');
    expect(container.textContent).toContain('Dashboard');
    expect(container.textContent).toContain('Plans');
    expect(container.textContent).toContain('Join');
    expect(container.textContent).toContain('Jomon');
    expect(container.textContent).toContain('Worker');
    // Customer links should NOT be shown
    expect(container.textContent).not.toContain('Find Pros');
  });
});

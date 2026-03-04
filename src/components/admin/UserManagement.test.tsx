import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import UserManagement from "./UserManagement";
import { User } from "../../types";

global.fetch = vi.fn();

const mockUsers: User[] = [
  {
    id: 1,
    firstname: "Alice",
    lastname: "Smith",
    role: "volunteer",
    email: "volunteer@test.com",
    dob: "1995-05-05",
    address: "…",
  },
  {
    id: 2,
    firstname: "Bob",
    lastname: "Doe",
    role: "beneficiary",
    email: "beneficiary@test.com",
    dob: "2005-10-10",
    address: "…",
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  (global.fetch as Mock).mockImplementation(async (url) => {
    if (url === "/api/users") {
      return { ok: true, json: async () => mockUsers };
    }
    return { ok: true, json: async () => [] };
  });
});

it("fetches and displays volunteers and beneficiaries", async () => {
  render(<UserManagement />);

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith("/api/users");
  });

  expect(screen.getByText("Alice Smith")).toBeInTheDocument();
  expect(screen.getByText("Bob Doe")).toBeInTheDocument();
  expect(screen.getAllByText(/volunteer/i).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/beneficiary/i).length).toBeGreaterThan(0);

  const rows = screen.getAllByRole("row");
  expect(rows.length).toBe(3); // header + two users
});

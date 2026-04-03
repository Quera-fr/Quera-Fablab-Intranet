import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import UserManagement from "./UserManagement";
import { User } from "../../types";

global.fetch = vi.fn();

const mockAdminUser: User = {
  id: 99,
  firstname: "Super",
  lastname: "Admin",
  role: "admin",
  email: "admin@assoc.fr",
  dob: "1980-01-01",
  address: "123 Rue",
};

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
    if (url === "/api/quera-points/totals") {
      return { ok: true, json: async () => [] };
    }
    if (url === "/api/golden-tickets/active") {
      return { ok: true, json: async () => null };
    }
    return { ok: true, json: async () => [] };
  });
});

it("fetches and displays volunteers and beneficiaries", async () => {
  render(<UserManagement currentUser={mockAdminUser} />);

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

it("displays Add and Golden Ticket buttons side by side (grouped right)", async () => {
  render(<UserManagement currentUser={mockAdminUser} />);

  await waitFor(() => {
    const addBtn = screen.getByRole("button", { name: /Ajouter/i });
    const goldenBtn = screen.getByRole("button", { name: /Golden Ticket/i });
    
    expect(addBtn).toBeInTheDocument();
    expect(goldenBtn).toBeInTheDocument();

    // Both should be visible in the top action area
    expect(addBtn.parentElement?.className).toContain("flex");
  });
});

it("sorts users by name, role and points when clicking headers", async () => {
  const sortableUsers: User[] = [
    {
      id: 1,
      firstname: "Zoe",
      lastname: "Alpha",
      role: "volunteer",
      email: "zoe@test.com",
      dob: "1990-01-01",
      address: "...",
    },
    {
      id: 2,
      firstname: "Bob",
      lastname: "Bravo",
      role: "beneficiary",
      email: "bob@test.com",
      dob: "2002-02-02",
      address: "...",
    },
    {
      id: 3,
      firstname: "Alice",
      lastname: "Charlie",
      role: "beneficiary",
      email: "alice@test.com",
      dob: "2003-03-03",
      address: "...",
    },
  ];

  (global.fetch as Mock).mockImplementation(async (url) => {
    if (url === "/api/users") {
      return { ok: true, json: async () => sortableUsers };
    }
    if (url === "/api/quera-points/totals") {
      return {
        ok: true,
        json: async () => [
          { user_id: 2, total_points: 30 },
          { user_id: 3, total_points: 5 },
        ],
      };
    }
    if (url === "/api/golden-tickets/active") {
      return { ok: true, json: async () => null };
    }
    return { ok: true, json: async () => [] };
  });

  render(<UserManagement currentUser={mockAdminUser} />);

  await waitFor(() => {
    expect(screen.getByText("Zoe Alpha")).toBeInTheDocument();
  });

  const getDisplayedNames = () =>
    screen
      .getAllByRole("row")
      .slice(1)
      .map((row) => {
        const cell = within(row).getAllByRole("cell")[1];
        return cell.textContent ?? "";
      });

  expect(getDisplayedNames()[0]).toContain("Alice Charlie");

  fireEvent.click(screen.getByRole("button", { name: /Nom/i }));
  expect(getDisplayedNames()[0]).toContain("Zoe Alpha");

  fireEvent.click(screen.getByRole("button", { name: /Rôle/i }));
  expect(getDisplayedNames()[0]).toContain("Bob Bravo");

  fireEvent.click(screen.getByRole("button", { name: /Pts Quera/i }));
  expect(getDisplayedNames()[0]).toContain("Zoe Alpha");

  fireEvent.click(screen.getByRole("button", { name: /Pts Quera/i }));
  expect(getDisplayedNames()[0]).toContain("Bob Bravo");
});

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import ProjectsSection from "@/components/ProjectsSection";
import SkillsSection from "@/components/SkillsSection";

afterEach(cleanup);

describe("Work collection", () => {
  it("keeps all projects and both working version destinations, then filters and restores the collection", async () => {
    render(<MemoryRouter><ProjectsSection /></MemoryRouter>);
    expect(screen.getAllByRole("article")).toHaveLength(11);
    expect(screen.getByRole("link", { name: /View Website Portfolio \(Previous Version\)/ })).toHaveAttribute("href", "https://matthew-w-jun.vercel.app/");
    expect(screen.getByRole("link", { name: /View Website Portfolio \(V2\)/ })).toHaveAttribute("href", "/versions/v2/index.html");
    fireEvent.click(screen.getByRole("button", { name: "Web experiences" }));
    await waitFor(() => expect(screen.getAllByRole("article")).toHaveLength(3));
    for (const name of ["Brushmo", "JSL Benefits", "Vessel Church OC"]) expect(screen.getByRole("heading", { name })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "All work" }));
    await waitFor(() => expect(screen.getAllByRole("article")).toHaveLength(11));
  });
});

describe("Skills exploration", () => {
  it("searches without case or whitespace sensitivity and combines search with the selected discipline", async () => {
    render(<MemoryRouter><SkillsSection /></MemoryRouter>);
    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "  PYTORCH  " } });
    expect(screen.getByRole("status")).toHaveTextContent("1 skill in focus");
    await waitFor(() => expect(screen.queryByText("TensorFlow")).not.toBeInTheDocument());
    expect(screen.getByText("PyTorch")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Frontend" }));
    expect(screen.getByText("No connections found.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Reset exploration/ }));
    expect(input).toHaveValue("");
    expect(input).toHaveFocus();
    expect(screen.getByRole("button", { name: "Everything" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("status")).toHaveTextContent("to explore");
  });

  it("supports discipline searches and clearing the query without losing the active filter", () => {
    render(<MemoryRouter><SkillsSection /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Security" }));
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "security" } });
    expect(screen.getByRole("status")).toHaveTextContent("7 skills in focus");
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(screen.getByRole("button", { name: "Security" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("searchbox")).toHaveFocus();
  });
});

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import PortfolioStory from "@/components/PortfolioStory";

afterEach(cleanup);

describe("Portfolio story closing", () => {
  it("shows the chosen closing without any style switchers", () => {
    render(<MemoryRouter><PortfolioStory /></MemoryRouter>);

    expect(screen.getByRole("heading", { name: "What are you trying to make easier?" })).toHaveAttribute("id", "contact-title");
    expect(screen.getByRole("link", { name: "Tell me about it." })).toHaveAttribute("href", "mailto:Jun.w.matthew@gmail.com");
    expect(screen.queryByRole("group", { name: /preview/i })).not.toBeInTheDocument();
  });
});

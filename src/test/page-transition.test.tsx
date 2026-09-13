import { fireEvent, render, screen } from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import PageTransition from "@/components/PageTransition";

describe("page transition", () => {
  it("uses Cascade across routes without remounting its wrapper", () => {
    const widthReads = vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(1200);
    const view = render(
      <MemoryRouter initialEntries={["/about"]}>
        <PageTransition>
          <div>
            <Link to="/projects">Open projects</Link>
            <Routes>
              <Route path="/about" element={<p>About page</p>} />
              <Route path="/projects" element={<p>Projects page</p>} />
            </Routes>
          </div>
        </PageTransition>
      </MemoryRouter>,
    );

    const wrapper = view.container.querySelector(".page-transition-content");
    expect(wrapper).toHaveClass("page-transition-cascade", "is-transitioning");
    expect(wrapper).toHaveAttribute("data-page-transition", "cascade");
    expect(screen.queryByRole("group", { name: "Preview page transition" })).not.toBeInTheDocument();
    const initialReads = widthReads.mock.calls.length;

    fireEvent.click(screen.getByRole("link", { name: "Open projects" }));
    expect(screen.getByText("Projects page")).toBeInTheDocument();
    expect(view.container.querySelector(".page-transition-content")).toBe(wrapper);
    expect(widthReads.mock.calls.length).toBeGreaterThan(initialReads);
  });
});

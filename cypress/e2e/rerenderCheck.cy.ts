import { TEST_URL } from "../constants";

function checkRenderCountByURLChange(
    rerenderedCounterText: string,
    notRerenderedCounterText: string
) {
    cy.get("#parentCounter").should("have.text", rerenderedCounterText);
    cy.get("#childCounter").should("have.text", rerenderedCounterText);
    cy.get("#siblingWithRouterAccessCounter").should("have.text", rerenderedCounterText);

    cy.get("#memoizedParentCounter").should("have.text", notRerenderedCounterText);
    cy.get("#siblingWithoutRouterAccessCounter").should("have.text", notRerenderedCounterText);
}

function testScenarios(functionName: "useQueryState" | "useQueryStates") {
    it("URL change rerenders whole page, but can be optimized with memo", () => {
        cy.visit(TEST_URL + `/tests/${functionName}/rerenderCheck?str=a`);
        if (Cypress.env("CYPRESS_STRICT")) checkRenderCountByURLChange("1", "1");

        cy.wait(50); // wait for next frame

        checkRenderCountByURLChange("2", "1");

        cy.get("#strInput").type("b");
        checkRenderCountByURLChange("3", "1");
    });
}

describe("useQueryState rerender behavior", () => testScenarios("useQueryState"));
describe("useQueryStates rerender behavior", () => testScenarios("useQueryStates"));

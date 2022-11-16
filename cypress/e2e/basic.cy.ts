import { TEST_URL } from "../constants";

function testScenarios(functionName: "useQueryState" | "useQueryStates") {
    it("Returns default value on first render", () => {
        cy.visit(TEST_URL + `/tests/${functionName}/basic?defaultStr=val`);
        if (Cypress.env("CYPRESS_STRICT"))
            cy.get("#defaultStr").should("have.text", JSON.stringify("default"));

        cy.wait(50); // wait for next frame
        cy.get("#defaultStr").should("have.text", JSON.stringify("val"));
    });

    it("Basic string param", () => {
        cy.visit(TEST_URL + `/tests/${functionName}/basic`);
        cy.wait(50); // wait for next frame

        cy.get("#str").should("have.text", JSON.stringify(null));

        // typing programatically is incompatible with react.
        // Increase delay to prevent keypresses from being ignored
        // https://github.com/cypress-io/cypress/issues/536
        cy.get("#strInput").type("newVal", { delay: 50 });
        cy.get("#str").should("have.text", JSON.stringify("newVal"));
        cy.location("search").should("eq", "?str=newVal");
    });

    it("Functional update on int", () => {
        cy.visit(TEST_URL + `/tests/${functionName}/basic`);
        cy.wait(50); // wait for next frame

        cy.get("#int").should("have.text", JSON.stringify(0));

        cy.get("#functionalAddInt").click();
        cy.get("#int").should("have.text", JSON.stringify(1));
        cy.location("search").should("eq", "?int=1");
    });

    it("Update query with timeout", () => {
        cy.visit(TEST_URL + `/tests/${functionName}/basic`);
        cy.wait(50); // wait for next frame

        cy.get("#int").should("have.text", JSON.stringify(0));

        cy.get("#changeStrWithTimeout").click();

        cy.wait(50); // wait a bit
        cy.get("#str").should("have.text", JSON.stringify(null));
        cy.location("search").should("eq", "");

        cy.wait(500); // wait for timeout
        cy.get("#str").should("have.text", JSON.stringify("timeout"));
        cy.location("search").should("eq", "?str=timeout");
    });

    it("Set multiple states at once", () => {
        cy.visit(TEST_URL);
        cy.visit(TEST_URL + `/tests/${functionName}/basic`);
        cy.wait(50); // wait for next frame

        // click to push multiple state update
        cy.get("#multipleSetWithPush").click();

        cy.get("#str").should("have.text", JSON.stringify("strValue"));
        cy.get("#int").should("have.text", JSON.stringify(10));
        cy.location("search").should("eq", "?str=strValue&int=10");

        // go back to before click
        cy.go("back");

        cy.get("#str").should("have.text", JSON.stringify(null));
        cy.get("#int").should("have.text", JSON.stringify(0));
        cy.location("search").should("eq", "");

        // go back to index
        cy.go("back");

        cy.location("pathname").should("eq", "/");
        cy.location("search").should("eq", "");
    });

    it("Set states in multiple components at once", () => {
        cy.visit(TEST_URL);
        cy.visit(TEST_URL + `/tests/${functionName}/useEffectMultiplePush`);

        if (Cypress.env("CYPRESS_STRICT")) {
            cy.location("search").should("eq", "");
            cy.get("#query").should("have.text", JSON.stringify({}));
        }

        cy.wait(50); // wait for next frame

        cy.location("search").should("eq", "?f1=1&f2=2&f3=3");
        cy.get("#query").should("have.text", JSON.stringify({ f1: "1", f2: "2", f3: "3" }));

        // go back to before effect
        cy.go("back");

        cy.location("search").should("eq", "");
        cy.get("#query").should("have.text", JSON.stringify({}));

        // go back to index
        cy.go("back");

        cy.location("pathname").should("eq", "/");
        cy.location("search").should("eq", "");
    });
}

describe("useQueryState basic", () => testScenarios("useQueryState"));
describe("useQueryStates basic", () => testScenarios("useQueryStates"));

import { TEST_URL } from "../../constants";

describe("useQueryState non dynamic memoization behavior", () => {
    it("Value and updater is memoized", () => {
        cy.visit(
            TEST_URL + `/tests/useQueryState/nonDynamicTest?val=${encodeURIComponent('{"a":2}')}`
        );
        if (Cypress.env("CYPRESS_STRICT")) {
            cy.get("#value").should("have.text", JSON.stringify({ a: 1 }));
            cy.get("#equality").should(
                "have.text",
                JSON.stringify({ valueEq: true, setValueEq: true })
            );
        }

        cy.wait(50); // wait for next frame. value is changed
        cy.get("#value").should("have.text", JSON.stringify({ a: 2 }));
        cy.get("#equality").should(
            "have.text",
            JSON.stringify({ valueEq: false, setValueEq: true })
        );

        // value is memoized
        cy.get("#forceRender").click();
        cy.get("#equality").should(
            "have.text",
            JSON.stringify({ valueEq: true, setValueEq: true })
        );
    });

    it("Key can be changed without dynamic", () => {
        cy.visit(
            TEST_URL +
                `/tests/useQueryState/nonDynamicTest?val=${encodeURIComponent(
                    '{"a":2}'
                )}&val2=${encodeURIComponent('{"a":10}')}`
        );

        cy.wait(50); // wait for next frame. value is changed
        cy.get("#value").should("have.text", JSON.stringify({ a: 2 }));

        cy.get("#changeKey").click();
        cy.get("#value").should("have.text", JSON.stringify({ a: 10 }));
        cy.get("#equality").should(
            "have.text",
            JSON.stringify({ valueEq: false, setValueEq: false })
        );
    });

    it("History mode can be changed without dynamic", () => {
        // History mode is replace at first
        cy.visit(TEST_URL);
        cy.visit(TEST_URL + "/tests/useQueryState/nonDynamicTest");
        cy.wait(50); // wait for next frame.

        cy.get("#updateValue").click();
        cy.get("#value").should("have.text", JSON.stringify({ a: 2 }));

        cy.go("back");
        cy.location("pathname").should("eq", "/");

        // Change history mode to push
        cy.visit(TEST_URL);
        cy.visit(TEST_URL + "/tests/useQueryState/nonDynamicTest");

        cy.wait(50); // wait for next frame.
        cy.get("#changeHistoryToPush").click();

        // only setValue function updated
        cy.get("#equality").should(
            "have.text",
            JSON.stringify({ valueEq: true, setValueEq: false })
        );

        // History mode changed to push
        cy.get("#updateValue").click();
        cy.get("#value").should("have.text", JSON.stringify({ a: 2 }));

        cy.go("back");
        cy.get("#value").should("have.text", JSON.stringify({ a: 1 }));
        cy.location("pathname").should("eq", "/tests/useQueryState/nonDynamicTest");

        cy.go("back");
        cy.location("pathname").should("eq", "/");
    });
});

describe("useQueryState dynamic option", () => {
    it("Serializers can't be changed if dynamic is false", () => {
        cy.visit(TEST_URL + "/tests/useQueryState/dynamicTest?dynamic=false");
        cy.wait(50); // wait for next frame.

        cy.get("#value").should("have.text", JSON.stringify({ a: 1 }));

        // Alter parser by changing default value
        cy.get("#incrementDefaultVal").click();

        // default value change not applied if dynamic: false
        cy.get("#value").should("have.text", JSON.stringify({ a: 1 }));
        cy.get("#equality").should(
            "have.text",
            JSON.stringify({ valueEq: true, setValueEq: true })
        );
    });

    it("Serializers can be changed if dynamic is true", () => {
        cy.visit(TEST_URL + "/tests/useQueryState/dynamicTest");
        cy.wait(50); // wait for next frame.
        
        cy.get("#value").should("have.text", JSON.stringify({ a: 1 }));

        // Alter parser by changing default value
        cy.get("#incrementDefaultVal").click();

        // default value change applied
        cy.get("#value").should("have.text", JSON.stringify({ a: 2 }));
        cy.get("#equality").should(
            "have.text",
            JSON.stringify({ valueEq: false, setValueEq: false })
        );
    });

    it("When using dynamic, memoization does not work if parse, serialize function is not memoized", () => {
        cy.visit(TEST_URL + "/tests/useQueryState/dynamicTest");
        cy.wait(50); // wait for next frame.

        // force rerender
        cy.get("#forceRender").click();

        // value and updater not memoized
        cy.get("#equality").should(
            "have.text",
            JSON.stringify({ valueEq: false, setValueEq: false })
        );
    });

    it("It has no problem with memoization when non-function queryTypes preset is used with dynamic option", () => {
        cy.visit(TEST_URL + "/tests/useQueryState/dynamicNonFunctionPreset");
        cy.wait(50); // wait for next frame.

        // force rerender
        cy.get("#forceRender").click();

        // value and updater not memoized
        cy.get("#equality").should(
            "have.text",
            JSON.stringify({ valueEq: true, setValueEq: true })
        );
    });
});

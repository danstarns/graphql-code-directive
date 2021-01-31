import { expect } from "chai";
import * as codeDirective from "../src";

describe("codeDirective", () => {
    it("should have typeDefs", () => {
        expect(codeDirective.typeDefs).to.be.a("string");
    });

    it("should have a directive property", () => {
        expect(Boolean(codeDirective.Directive)).to.equal(true);
    });
});

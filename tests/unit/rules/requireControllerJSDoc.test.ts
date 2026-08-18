import { lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

const RULE = "require-controller-jsdoc"

describe("require-controller-jsdoc", () => {
    test("It should not report a controller with a leading JSDoc", ({ expect }) => {
        const code =
            "/**\n * Proxy requests from frontend to client clusters.\n */\nexport default class ClusterProxyController extends BaseController {}"
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should not report a controller documented above its decorator", ({ expect }) => {
        const code =
            "/**\n * The base controller every controller extends.\n */\n@inject()\nexport default class BaseController {}"
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should not report a controller documented above stacked decorators", ({ expect }) => {
        const code =
            "/**\n * Proxy requests to client clusters.\n */\n@inject()\n@middleware()\nexport default class ClusterProxyController {}"
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should report a decorated controller with no JSDoc", ({ expect }) => {
        expect(lintRule(RULE, "@inject()\nexport default class UsersController {}")).toHaveLength(1)
    })

    test("It should not report a default-exported class not named `*Controller`", ({ expect }) => {
        expect(lintRule(RULE, "export default class ClusterProxy extends BaseController {}")).toHaveLength(0)
    })

    test("It should not report a `*Controller` class that is not the default export", ({ expect }) => {
        expect(lintRule(RULE, "class ClusterProxyController extends BaseController {}")).toHaveLength(0)
    })

    test("It should report a controller with no JSDoc", ({ expect }) => {
        const messages = lintRule(RULE, "export default class ClusterProxyController extends BaseController {}")
        expect(messages).toHaveLength(1)
        expect(messages[0]?.ruleId).toBe("nitpicker/require-controller-jsdoc")
        expect(messages[0]?.messageId).toBe("missingJSDoc")
    })

    test("It should report a controller with no base class", ({ expect }) => {
        expect(lintRule(RULE, "export default class UsersController {}")).toHaveLength(1)
    })

    test("It should not treat a leading line comment as documentation", ({ expect }) => {
        const code = "// proxies requests\nexport default class ClusterProxyController extends BaseController {}"
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const messages = lintRule(RULE, "export default class ClusterProxyController extends BaseController {}")
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})

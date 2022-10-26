import commonjs from "@rollup/plugin-commonjs";
import typescript from "rollup-plugin-typescript2";
import peerDepsExternal from "rollup-plugin-peer-deps-external";

const config = [
    {
        input: ["src/index.ts", "src/nullableQueryTypes.ts", "src/utils.ts"],
        output: [
            {
                sourcemap: true,
                dir: "dist/cjs",
                format: "cjs",
            },
            {
                sourcemap: true,
                dir: "dist/es",
                format: "esm",
            },
        ],
        plugins: [
            peerDepsExternal(),
            typescript({ tsconfig: "./tsconfig.build.json", useTsconfigDeclarationDir: true }),
            commonjs({ include: "node_modules/**" }),
        ],
    },
];
export default config;

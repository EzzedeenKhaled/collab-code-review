const vm = require("vm");

class CodeExecutionService {
  createSandbox() {
    let output = "";
    let errorOutput = "";

    return {
      sandbox: {
        console: {
          log: (...args) => {
            output +=
              args
                .map((arg) =>
                  typeof arg === "object"
                    ? JSON.stringify(arg, null, 2)
                    : String(arg),
                )
                .join(" ") + "\n";
          },
          error: (...args) => {
            errorOutput +=
              args
                .map((arg) =>
                  typeof arg === "object"
                    ? JSON.stringify(arg, null, 2)
                    : String(arg),
                )
                .join(" ") + "\n";
          },
          warn: (...args) => {
            errorOutput +=
              "[WARN] " +
              args
                .map((arg) =>
                  typeof arg === "object"
                    ? JSON.stringify(arg, null, 2)
                    : String(arg),
                )
                .join(" ") +
              "\n";
          },
        },
        setTimeout,
        setInterval,
        clearTimeout,
        clearInterval,
        Math,
        Date,
        JSON,
        String,
        Number,
        Boolean,
        Array,
        Object,
        Buffer,
        process: {
          env: {},
          version: process.version,
          versions: process.versions,
        },
      },
      getOutput: () => output,
      getErrorOutput: () => errorOutput,
    };
  }

  async executeCode(code, timeout = 5000) {
    const { sandbox, getOutput, getErrorOutput } = this.createSandbox();

    try {
      const context = vm.createContext(sandbox);
      vm.runInContext(code, context, {
        timeout,
        displayErrors: true,
        filename: "user-code.js",
      });

      const finalOutput = (getOutput() + getErrorOutput()).trim();
      return {
        output: finalOutput || "(No output)",
        error: null,
      };
    } catch (err) {
      return {
        output: "",
        error: err.message,
      };
    }
  }
}

module.exports = new CodeExecutionService();

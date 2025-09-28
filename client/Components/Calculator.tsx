import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type Operator = "+" | "-" | "×" | "÷";

type CalcState = {
  display: string;
  accumulator: number | null;
  operator: Operator | null;
  waitingForSecond: boolean;
  lastOp: Operator | null;
  lastArg: number | null;
};

const formatForDisplay = (value: string) => {
  if (value === "∞" || value === "NaN") return value;
  if (!value.includes(".")) {
    const n = Number(value);
    if (!Number.isFinite(n)) return value;
    return n.toLocaleString();
  }
  const [int, dec] = value.split(".");
  const n = Number(int);
  const intPart = Number.isFinite(n) ? n.toLocaleString() : int;
  return `${intPart}.${dec}`;
};

export default function Calculator() {
  const [state, setState] = useState<CalcState>({
    display: "0",
    accumulator: null,
    operator: null,
    waitingForSecond: false,
    lastOp: null,
    lastArg: null,
  });

  const current = useMemo(() => Number(state.display.replace(/,/g, "")), [
    state.display,
  ]);

  const clearAll = () =>
    setState({
      display: "0",
      accumulator: null,
      operator: null,
      waitingForSecond: false,
      lastOp: null,
      lastArg: null,
    });

  const clearEntry = () =>
    setState((s) => ({
      ...s,
      display: "0",
      waitingForSecond: s.operator ? true : false,
    }));

  const inputDigit = (d: string) => {
    setState((s) => {
      if (s.waitingForSecond) {
        return { ...s, display: d, waitingForSecond: false };
      }
      if (s.display === "0") return { ...s, display: d };
      if (s.display.replace(/,/g, "").length >= 12) return s;
      return { ...s, display: s.display + d };
    });
  };

  const inputDot = () => {
    setState((s) => {
      if (s.waitingForSecond) return { ...s, display: "0.", waitingForSecond: false };
      if (s.display.includes(".")) return s;
      return { ...s, display: s.display + "." };
    });
  };

  const toggleSign = () => {
    setState((s) => {
      const raw = s.display.replace(/,/g, "");
      if (raw === "0") return s;
      if (raw.startsWith("-")) return { ...s, display: raw.slice(1) };
      return { ...s, display: "-" + raw };
    });
  };

  const percent = () => {
    setState((s) => {
      const raw = Number(s.display.replace(/,/g, ""));
      if (!Number.isFinite(raw)) return s;
      // iOS-like percent: when there is an accumulator and operator, use context for +/-, otherwise simple divide by 100
      if (s.accumulator != null && s.operator) {
        if (s.operator === "+" || s.operator === "-") {
          const v = (s.accumulator * raw) / 100;
          return { ...s, display: String(v) };
        }
        const v = raw / 100;
        return { ...s, display: String(v) };
      }
      const v = raw / 100;
      return { ...s, display: String(v) };
    });
  };

  const compute = (a: number, b: number, op: Operator) => {
    switch (op) {
      case "+":
        return a + b;
      case "-":
        return a - b;
      case "×":
        return a * b;
      case "÷":
        return b === 0 ? Infinity : a / b;
    }
  };

  const setOperator = (op: Operator) => {
    setState((s) => {
      const a = s.accumulator;
      const b = Number(s.display.replace(/,/g, ""));
      if (s.operator && !s.waitingForSecond && a != null) {
        const res = compute(a, b, s.operator);
        return {
          display: String(res),
          accumulator: res,
          operator: op,
          waitingForSecond: true,
          lastOp: null,
          lastArg: null,
        };
      }
      return {
        ...s,
        accumulator: b,
        operator: op,
        waitingForSecond: true,
        lastOp: null,
        lastArg: null,
      };
    });
  };

  const equals = () => {
    setState((s) => {
      const a = s.accumulator;
      const b = Number(s.display.replace(/,/g, ""));
      if (s.operator && a != null && !s.waitingForSecond) {
        const res = compute(a, b, s.operator);
        return {
          display: String(res),
          accumulator: res,
          operator: null,
          waitingForSecond: false,
          lastOp: s.operator,
          lastArg: b,
        };
      }
      if (s.lastOp && s.lastArg != null) {
        const res = compute(b, s.lastArg, s.lastOp);
        return {
          ...s,
          display: String(res),
          accumulator: res,
        };
      }
      return s;
    });
  };

  const onClear = () => {
    if (
      state.display !== "0" ||
      state.accumulator !== null ||
      state.operator !== null
    ) {
      clearEntry();
    } else {
      clearAll();
    }
  };

  const clearLabel =
    state.display !== "0" || state.accumulator !== null || state.operator
      ? "C"
      : "AC";

  const opActive = (op: Operator) => state.operator === op && state.waitingForSecond;

  const Button: React.FC<{
    children: React.ReactNode;
    variant?: "dark" | "light" | "accent";
    className?: string;
    onClick?: () => void;
    active?: boolean;
    ariaLabel?: string;
  }> = ({ children, variant = "dark", className, onClick, active, ariaLabel }) => (
    <button
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        "rounded-full h-16 sm:h-20 flex items-center justify-center text-2xl sm:text-3xl select-none transition active:opacity-80",
        variant === "dark" && "bg-calc-key text-white",
        variant === "light" && "bg-calc-keyAlt text-black",
        variant === "accent" && (active ? "bg-white text-calc-accent" : "bg-calc-accent text-white"),
        className,
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-neutral-900 to-black text-white flex items-end justify-center p-4">
      <div className="w-full max-w-sm sm:max-w-md">
        <div className="mb-2 flex items-center justify-between text-sm text-neutral-400 px-2">
          <span>{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          <div className="flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-white/80"></span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-white/80"></span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-white/80"></span>
          </div>
        </div>

        <div className="px-2 py-3">
          <div className="text-right text-6xl sm:text-7xl md:text-8xl font-light tabular-nums leading-none break-words min-h-[72px]">
            {formatForDisplay(state.display)}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 px-2 pb-6">
          <Button variant="light" onClick={onClear} ariaLabel={clearLabel}>
            {clearLabel}
          </Button>
          <Button variant="light" onClick={toggleSign} ariaLabel="toggle sign">
            ±
          </Button>
          <Button variant="light" onClick={percent} ariaLabel="percent">
            %
          </Button>
          <Button
            variant="accent"
            active={opActive("÷")}
            onClick={() => setOperator("÷")}
            ariaLabel="divide"
          >
            ÷
          </Button>

          <Button onClick={() => inputDigit("7")}>7</Button>
          <Button onClick={() => inputDigit("8")}>8</Button>
          <Button onClick={() => inputDigit("9")}>9</Button>
          <Button
            variant="accent"
            active={opActive("×")}
            onClick={() => setOperator("×")}
            ariaLabel="multiply"
          >
            ×
          </Button>

          <Button onClick={() => inputDigit("4")}>4</Button>
          <Button onClick={() => inputDigit("5")}>5</Button>
          <Button onClick={() => inputDigit("6")}>6</Button>
          <Button
            variant="accent"
            active={opActive("-")}
            onClick={() => setOperator("-")}
            ariaLabel="subtract"
          >
            −
          </Button>

          <Button onClick={() => inputDigit("1")}>1</Button>
          <Button onClick={() => inputDigit("2")}>2</Button>
          <Button onClick={() => inputDigit("3")}>3</Button>
          <Button
            variant="accent"
            active={opActive("+")}
            onClick={() => setOperator("+")}
            ariaLabel="add"
          >
            +
          </Button>

          <Button className="col-span-2 justify-start pl-8" onClick={() => inputDigit("0")}>
            0
          </Button>
          <Button onClick={inputDot}>.</Button>
          <Button variant="accent" onClick={equals} ariaLabel="equals">
            =
          </Button>
        </div>
      </div>
    </div>
  );
}
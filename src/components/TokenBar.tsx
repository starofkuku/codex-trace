import type { TokenInfo } from "../../shared/types";
import { formatTokens } from "../../shared/format";

interface TokenBarProps {
  tokens: TokenInfo;
  className?: string;
}

export function tokenBreakdownTitle(tokens: TokenInfo): string {
  return [
    `Input: ${formatTokens(tokens.input_tokens)}`,
    `Cached input: ${formatTokens(tokens.cached_input_tokens)}`,
    `Output: ${formatTokens(tokens.output_tokens)}`,
    `Reasoning output: ${formatTokens(tokens.reasoning_output_tokens)}`,
    `Total: ${formatTokens(tokens.total_tokens)}`,
  ].join("\n");
}

export function TokenBar({ tokens, className }: TokenBarProps) {
  const {
    input_tokens,
    cached_input_tokens,
    output_tokens,
    reasoning_output_tokens,
    total_tokens,
    model_context_window,
  } = tokens;
  const pct =
    model_context_window > 0 ? Math.min(100, (total_tokens / model_context_window) * 100) : 0;

  return (
    <div
      className={className ? `token-bar ${className}` : "token-bar"}
      title={tokenBreakdownTitle(tokens)}
    >
      <div className="token-bar__track">
        {model_context_window > 0 && (
          <div className="token-bar__fill" style={{ width: `${pct.toFixed(1)}%` }} />
        )}
      </div>
      <div className="token-bar__stats">
        <span className="token-bar__total">total {formatTokens(total_tokens)}</span>
        <span style={{ color: "var(--token-input)" }}>input {formatTokens(input_tokens)}</span>
        <span style={{ color: "var(--token-cached)" }}>
          cached {formatTokens(cached_input_tokens)}
        </span>
        <span style={{ color: "var(--token-output)" }}>output {formatTokens(output_tokens)}</span>
        <span style={{ color: "var(--token-reasoning)" }}>
          reasoning {formatTokens(reasoning_output_tokens)}
        </span>
      </div>
    </div>
  );
}

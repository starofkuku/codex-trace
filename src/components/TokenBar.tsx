import type { TokenUsage } from "../../shared/types";
import { displayedTokenTotal, formatTokens, nonCachedInputTokens } from "../../shared/format";

interface TokenBarProps {
  tokens: TokenUsage;
  className?: string;
}

export function tokenBreakdownTitle(tokens: TokenUsage): string {
  const input = nonCachedInputTokens(tokens.input_tokens, tokens.cached_input_tokens);
  const total = displayedTokenTotal(
    tokens.input_tokens,
    tokens.cached_input_tokens,
    tokens.output_tokens,
  );
  return [
    `Input: ${formatTokens(input)}`,
    `Cached input: ${formatTokens(tokens.cached_input_tokens)}`,
    `Output: ${formatTokens(tokens.output_tokens)}`,
    `Reasoning output: ${formatTokens(tokens.reasoning_output_tokens)}`,
    `Total: ${formatTokens(total)}`,
  ].join("\n");
}

export function TokenBar({ tokens, className }: TokenBarProps) {
  const { input_tokens, cached_input_tokens, output_tokens, reasoning_output_tokens } = tokens;
  const input = nonCachedInputTokens(input_tokens, cached_input_tokens);
  const total = displayedTokenTotal(input_tokens, cached_input_tokens, output_tokens);

  return (
    <div
      className={className ? `token-bar ${className}` : "token-bar"}
      title={tokenBreakdownTitle(tokens)}
    >
      <div className="token-bar__stats">
        <span className="token-bar__total">total {formatTokens(total)}</span>
        <span style={{ color: "var(--token-input)" }}>input {formatTokens(input)}</span>
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

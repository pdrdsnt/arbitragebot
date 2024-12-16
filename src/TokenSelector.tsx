import { useState, useContext, useRef, useEffect } from "react";
import { ctx } from "./App"; // Adjust the import path as per your project structure.
import "./TokenSelector.css" // Import the CSS file

function TokenSelector({
  handleTokenSelect,
  selectedTokens,
}: {
  handleTokenSelect: CallableFunction;
  selectedTokens: Array<string>;
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const _ctx = useContext(ctx);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const tokens = Object.keys(_ctx.tokens); // Retrieve tokens from the context.

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleOutsideClick = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsDropdownOpen(false);
    }
  };

  useEffect(() => {
    if (isDropdownOpen) {
      document.addEventListener("click", handleOutsideClick);
    } else {
      document.removeEventListener("click", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [isDropdownOpen]);

  return (
    <div className="token-selector" ref={dropdownRef}>
      {/* Input field */}
      <div>
        <input
          className="token-selector__input"
          readOnly
          onClick={toggleDropdown}
          aria-haspopup="listbox"
          aria-expanded={isDropdownOpen}
        />
      </div>

      {/* Dropdown menu */}
      {isDropdownOpen && (
        <ul className="token-selector__dropdown">
          {tokens.length > 0 ? (
            tokens.map((token) => (
              <li
                className={`token-selector__item ${selectedTokens.includes(token) ? 'token-selector__item--selected' : ''}`}
                onMouseEnter={(e: any) => {e.target.style.backgroundColor = "rgb(26, 8, 48)"}}
                onMouseLeave={(e: any) => (e.target.style.backgroundColor =  selectedTokens.includes(token) ? "rgb(22, 12, 42)" : "black")}
                onClick={() => handleTokenSelect(token)}
              >
                {_ctx.tokens[token].name}
              </li>
            ))
          ) : (
            <li className="token-selector__item">
              No tokens available
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

export default TokenSelector;
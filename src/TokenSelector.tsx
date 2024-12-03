import { useState, useContext, useRef, useEffect } from "react";
import { ctx } from "./App"; // Adjust the import path as per your project structure.

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
    <div style={{ position: "relative" }} ref={dropdownRef}>
      {/* Input field */}
      <div>
        <input
          readOnly
          onClick={toggleDropdown}
          style={{
            cursor: "pointer",
            padding: "1px",
            border: "1em solid black",
            justifyContent: "flex-end",
            outline: "none",
            boxShadow: "none",
          }}
          aria-haspopup="listbox"
          aria-expanded={isDropdownOpen}
        />
      </div>

      {/* Dropdown menu */}
      {isDropdownOpen && (
        <ul
          style={{
            position: "absolute", // Make it absolutely positioned
            zIndex: 1000, // Bring it above other elements
            border: "1em solid black",
            maxHeight: "200px",
            overflowY: "auto",
            backgroundColor: "black",
            padding: 0,
            margin: 0,
            listStyleType: "none",
            width: "100%", // Match width to parent if needed
          }}
        >
          {tokens.length > 0 ? (
            tokens.map((token) => (
              <li
                key={token}
                role="option"
                aria-selected={selectedTokens.includes(token)}
                style={{
                  cursor: "pointer",
                  padding: "10px",
                  background: selectedTokens.includes(token)
                    ? "rgb(26, 8, 48)"
                    : "black",
                  color: selectedTokens.includes(token) ? "grey" : "white",
                  transition: "background-color 2.8 easy-in-out",
                }}
                onMouseEnter={(e: any) => (e.target.style.backgroundColor = "rgb(26, 8, 48)")}
                onMouseLeave={(e: any) => (e.target.style.backgroundColor =  selectedTokens.includes(token) ? "rgb(20, 28, 40)" : "black")}
                onClick={() => handleTokenSelect(token)}
              >
                {_ctx.tokens[token].name}
              </li>
            ))
          ) : (
            <li
              style={{
                padding: "10px",
                textAlign: "center",}}
                onMouseEnter={(e: any) => (e.target.style.backgroundColor = "black")}
                onMouseLeave={(e: any) => (e.target.style.backgroundColor = "white")}
            >
              No tokens available
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

export default TokenSelector;

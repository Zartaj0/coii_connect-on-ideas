import { useId, useState } from "react";

import {
  ADDA_COLORS,
  ADDA_NAME_MAX,
  ADDA_STYLE_LABELS,
  ADDA_STYLES,
  addaColor,
  cleanAddaName,
} from "@/data/adda";
import type { AddaLook } from "@/data/adda";
import { TentPreview } from "@/ui/TentPreview";

/** Name the adda and pick a tent style and colour; a live preview shows the result. */
export function AddaLookPicker({
  initial,
  initialName,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  readonly initial: AddaLook;
  /** Shown as the placeholder: the name used when you leave it empty. */
  readonly initialName: string;
  readonly submitLabel: string;
  readonly onSubmit: (look: AddaLook, name: string) => void;
  readonly onCancel?: () => void;
}) {
  const [look, setLook] = useState<AddaLook>(initial);
  const [name, setName] = useState("");
  const styleId = useId();
  const colorId = useId();
  const nameId = useId();
  const color = addaColor(look.color).css;
  const nameOk = name.trim() === "" || cleanAddaName(name) !== null;
  return (
    <form
      className="adda-picker"
      onSubmit={(e) => {
        e.preventDefault();
        if (nameOk) onSubmit(look, cleanAddaName(name) ?? initialName);
      }}
    >
      <label className="adda-picker__legend" htmlFor={nameId}>
        Name
      </label>
      <input
        id={nameId}
        className="adda-picker__name"
        value={name}
        maxLength={ADDA_NAME_MAX}
        placeholder={initialName}
        aria-invalid={!nameOk || undefined}
        onChange={(e) => setName(e.target.value)}
      />
      {nameOk ? null : <p className="adda-note">No links or @handles in the name.</p>}
      <div className="adda-picker__preview">
        <TentPreview kind={look.style} color={color} size={132} />
      </div>
      <fieldset className="adda-picker__group" aria-labelledby={styleId}>
        <legend id={styleId} className="adda-picker__legend">
          Style
        </legend>
        <div className="adda-picker__styles">
          {ADDA_STYLES.map((style) => (
            <label key={style} className="adda-style">
              <input
                type="radio"
                name="adda-style"
                value={style}
                checked={look.style === style}
                onChange={() => setLook({ ...look, style })}
              />
              <TentPreview kind={style} color={color} size={56} />
              <span>{ADDA_STYLE_LABELS[style]}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="adda-picker__group" aria-labelledby={colorId}>
        <legend id={colorId} className="adda-picker__legend">
          Colour
        </legend>
        <div className="adda-picker__colors">
          {ADDA_COLORS.map((c) => (
            <label key={c.id} className="adda-swatch" style={{ background: c.css }}>
              <input
                type="radio"
                name="adda-color"
                value={c.id}
                checked={look.color === c.id}
                onChange={() => setLook({ ...look, color: c.id })}
                aria-label={c.label}
              />
            </label>
          ))}
        </div>
      </fieldset>
      <div className="adda-picker__actions">
        <button type="submit" className="btn btn--wave">
          {submitLabel}
        </button>
        {onCancel ? (
          <button type="button" className="btn btn--quiet" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}

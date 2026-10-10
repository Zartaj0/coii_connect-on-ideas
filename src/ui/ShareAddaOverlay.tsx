import "@/ui/adda.css";
import { useEffect, useId, useMemo, useState } from "react";

import type { MyAdda } from "@/adda/storage";
import { useActions, useApp } from "@/app/context";
import type { AppState } from "@/app/store";
import { canvasToBlob, drawAddaCard } from "@/ui/addaCard";
import {
  cardFaces,
  cardFileName,
  linkedInShareUrl,
  namesText,
  SHARE_TEXT,
  shareCaption,
  telegramShareUrl,
  xIntentUrl,
} from "@/ui/addaShare";
import type { CardFace } from "@/ui/addaShare";
import { Glyph, Icon } from "@/ui/Icon";
import { CloseButton, Overlay } from "@/ui/Overlay";

interface Card {
  readonly file: File;
  readonly url: string;
}

function sharedAdda(s: AppState): MyAdda | null {
  return s.adda?.addas.find((a) => a.id === s.shareAddaId) ?? null;
}

/**
 * The faces on the card, as a value that only changes when the crew does: people arriving on
 * the map or points ticking up must not redraw the image.
 */
function useFaces(): CardFace[] {
  const key = useApp((s) => {
    const adda = sharedAdda(s);
    return s.you && adda ? JSON.stringify(cardFaces(s.you, adda, s.people)) : "[]";
  });
  return useMemo(() => JSON.parse(key) as CardFace[], [key]);
}

/** Draws the card once per crew and look; frees the preview URL when it changes or closes. */
function useCard(faces: readonly CardFace[], adda: MyAdda | null): Card | "failed" | null {
  const [card, setCard] = useState<Card | "failed" | null>(null);
  const look = adda?.look ?? null;
  const title = adda?.name ?? "";
  useEffect(() => {
    if (!look || faces.length === 0) return undefined;
    let url: string | null = null;
    let cancelled = false;
    drawAddaCard(title, faces, look)
      .then(canvasToBlob)
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setCard({ file: new File([blob], cardFileName(title), { type: "image/png" }), url });
      })
      .catch(() => {
        if (!cancelled) setCard("failed");
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [faces, look, title]);
  return card;
}

function download(card: Card): void {
  const a = document.createElement("a");
  a.href = card.url;
  a.download = card.file.name;
  a.click();
}

function canShareFiles(file: File): boolean {
  try {
    return typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Puts the picture on the clipboard, so it pastes straight into a post. */
async function copyImage(file: File): Promise<boolean> {
  try {
    await navigator.clipboard.write([new ClipboardItem({ "image/png": file })]);
    return true;
  } catch {
    return false;
  }
}

function pasteKeys(): string {
  return /Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘V" : "Ctrl+V";
}

/**
 * Web links can't attach a picture to a post on X, LinkedIn or Telegram, so the composer opens
 * with the text filled in and the picture goes on the clipboard (or downloads) to paste in.
 */
function useOpenComposer(card: Card): (url: string, site: string) => Promise<void> {
  const actions = useActions();
  return async (url, site) => {
    const copied = await copyImage(card.file);
    if (!copied) download(card);
    window.open(url, "_blank", "noopener,noreferrer");
    const how = copied
      ? `Picture copied: press ${pasteKeys()} in the post`
      : "Picture saved: attach it";
    actions.pushToast(`${how} to add it on ${site}.`, "circus_tent", "success");
  };
}

function ShareButtons({ card, title }: { readonly card: Card; readonly title: string }) {
  const actions = useActions();
  const open = useOpenComposer(card);
  const native = canShareFiles(card.file);
  const shareNative = (): void => {
    navigator.share({ files: [card.file], title, text: shareCaption() }).catch(() => undefined);
  };
  const copyCaption = (): void => {
    void copyText(shareCaption()).then(
      (ok) => ok && actions.pushToast("Text copied.", "circus_tent", "success"),
    );
  };
  return (
    <div className="share-actions">
      {native ? (
        <button type="button" className="btn btn--wave btn--big" onClick={shareNative}>
          <Icon id="circus_tent" size={24} />
          Share picture + text
        </button>
      ) : null}
      <div className="share-actions__row">
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => void open(xIntentUrl(), "X")}
        >
          Share on X
        </button>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => void open(linkedInShareUrl(), "LinkedIn")}
        >
          Share on LinkedIn
        </button>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => void open(telegramShareUrl(), "Telegram")}
        >
          Share on Telegram
        </button>
      </div>
      <div className="share-actions__row">
        <button type="button" className="btn btn--quiet" onClick={() => download(card)}>
          Download picture
        </button>
        <button type="button" className="btn btn--quiet" onClick={copyCaption}>
          Copy text
        </button>
      </div>
      <p className="share__caption">“{SHARE_TEXT}” + link</p>
    </div>
  );
}

function CardPreview({
  card,
  title,
  faces,
}: {
  readonly card: Card | "failed" | null;
  readonly title: string;
  readonly faces: readonly CardFace[];
}) {
  if (card === "failed") {
    return (
      <p className="empty-note">This browser couldn't draw the picture. Try another browser.</p>
    );
  }
  if (!card) {
    return (
      <p className="share-card share-card--loading" role="status">
        Drawing your adda…
      </p>
    );
  }
  const names = namesText(faces.map((f) => f.name));
  return <img className="share-card" src={card.url} alt={`${title}: ${names}`} />;
}

/** "Share": a picture of one adda's crew around you, ready for X, LinkedIn or Telegram. */
export function ShareAddaOverlay({
  leaving,
  onClose,
}: {
  readonly leaving: boolean;
  readonly onClose: () => void;
}) {
  const titleId = useId();
  const adda = useApp(sharedAdda);
  const faces = useFaces();
  const card = useCard(faces, adda);
  const title = adda?.name ?? "";
  return (
    <Overlay kind="share" labelledBy={titleId} leaving={leaving} onClose={onClose}>
      <div className="overlay__scroll share">
        <header className="share__head">
          <CloseButton onClose={onClose} />
          <h2 id={titleId} className="share__title">
            Share {title}
          </h2>
          <p className="share__hint">
            <Glyph name="check" size={16} />
            Only you and people who said yes are in the picture, with their names. No handles.
          </p>
        </header>
        <CardPreview card={card} title={title} faces={faces} />
        {card && card !== "failed" ? <ShareButtons card={card} title={title} /> : null}
      </div>
    </Overlay>
  );
}

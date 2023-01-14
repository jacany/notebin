"use client";

import "websocket-polyfill";
import { useContext, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { NostrService } from "./utils/NostrService";
import { RelayContext } from "./context/relay-provider.jsx";
import { EventContext } from "./context/event-provider.jsx";
import Button from "./Button";
import Select from "./Select";
import { LANGUAGES, RELAYS } from "./constants";
import TextInput from "./TextInput";

export default function NoteOptions({ text, onSetSyntaxOption }: any) {
  const [syntax, setSyntax] = useState("");
  const [postLoading, setPostLoading] = useState(false);
  const relayUrlInput = useRef<HTMLSelectElement>(null);
  const router = useRouter();
  // @ts-ignore
  const { relay, setRelay } = useContext(RelayContext);
  // @ts-ignore
  const { setEvent } = useContext(EventContext);

  const post = async (e: any) => {
    e.preventDefault();
    setPostLoading(true);

    const privateKey = null;
    // const publicKey = null;
    const publicKey = await nostr.getPublicKey();
    let event = NostrService.createEvent(publicKey, text, syntax);
    event = await NostrService.addEventData(event);

    let pub = relay.publish(event);
    pub.on("ok", () => {
      console.debug(`${relay.url} has accepted our event`);
    });

    pub.on("seen", async () => {
      console.debug(`we saw the event on ${relay.url}`);
      const retrieved_event = await NostrService.getEvent(event.id, relay);
      console.log("got event:", retrieved_event);
      await setEvent(retrieved_event);
      console.log("did it");
      router.push("/note/" + event.id);
    });

    pub.on("failed", (reason: any) => {
      console.error(`failed to publish to ${relay.url}: ${reason}`);
    });
  };

  function handleSelect(e: any) {
    onSetSyntaxOption(e.target.value);
    setSyntax(e.target.value);
  }

  return (
    <form onSubmit={post}>
      <div className="text-xl dark:text-slate-300 p-3 rounded-md flex flex-col justify-between">
        Options
        <div className="flex flex-col gap-4 py-4">
          {/* <TextInput */}
          {/*   label="Filename" */}
          {/*   placeholder="Enter filename..." */}
          {/*   onChange={(e) => setSyntax(e.target.value)} */}
          {/* /> */}
          <Select
            label="Syntax"
            options={LANGUAGES}
            onChange={(e: any) => handleSelect(e)}
            defaultValue="markdown"
          />
          {/* <Select */}
          {/*   label="Kind" */}
          {/*   options={["1", "2", "3"]} */}
          {/* /> */}
          <TextInput
            label="Tags"
            placeholder="Enter tags..."
          />
          <Select
            label="Relay"
            innerRef={relayUrlInput}
            options={RELAYS}
          />
          <div>
            <input
              type="text"
              placeholder="Enter Tags..."
              className="px-3 py-2 rounded w-full text-slate-300 bg-neutral-700"
            />
          </div>
          <span className="text-sm">▶ Advanced</span>
        </div>
        <Button loading={postLoading} type="submit">
          {postLoading ? "Sending..." : "Send"}
        </Button>
      </div>
    </form >
  );
}

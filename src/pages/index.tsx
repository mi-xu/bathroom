import { formatDistanceToNow } from "date-fns";
import { Inter as FontSans } from "next/font/google";
import Head from "next/head";
import { FaToiletPaper, FaToiletPaperSlash } from "react-icons/fa6";
import { PiPencilSimple } from "react-icons/pi";

export const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { api } from "~/utils/api";
import { getWaitList } from "~/utils/utils";

export default function Home() {
  const [name, setName] = useLocalStorage("name", "");

  return (
    <>
      <Head>
        <title>Bathroom</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={cn("space-y-4 p-4 font-sans", fontSans.variable)}>
        {name === "" ? (
          <NameForm signin={setName} />
        ) : (
          <RoomStatus name={name} signout={() => setName("")} />
        )}
      </div>
    </>
  );
}

function NameForm({ signin }: { signin: (name: string) => void }) {
  const [nameState, setNameState] = useState("");
  return (
    <>
      <Input
        type="text"
        placeholder="Name"
        value={nameState}
        onChange={(e) => {
          setNameState(e.target.value);
        }}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          signin(nameState);
        }}
      >
        Enter
      </Button>
    </>
  );
}

function RoomStatus({ name, signout }: { name: string; signout: () => void }) {
  const rooms = api.room.get.useQuery(undefined, { refetchInterval: 1000 });
  const enterMut = api.room.enter.useMutation();
  const leaveMut = api.room.leave.useMutation();
  const isUsingARoom = rooms.data?.some((room) => room.occupant === name);
  const isWaitingAny = rooms.data?.some((room) => room.waitList.includes(name));
  const waitMut = api.room.wait.useMutation();
  const unwaitMut = api.room.unwait.useMutation();
  return (
    <>
      <div className="flex w-full items-center justify-between space-x-2">
        <div className="text-lg text-slate-500">{name}</div>
        <Button variant="outline" size="icon" onClick={signout}>
          <PiPencilSimple />
        </Button>
      </div>
      {rooms.data?.map((room) => {
        const isOpen = room.occupant == null;
        const isOccupiedByMe = room.occupant === name;
        const { enteredAt } = room;
        const waitList = getWaitList(room);
        const isWaiting =
          waitList.find((person) => person.name === name) != null;
        const firstWaitTime = waitList[0]?.time;
        const numInFront = waitList.findIndex((person) => person.name === name);
        return (
          <div
            key={room.id}
            className={cn(
              "flex h-[260px] flex-col justify-between rounded-md border p-2 shadow-md",
              isOpen
                ? "border-green-300 bg-green-200"
                : "border-red-300 bg-red-200",
            )}
          >
            <div className={cn("flex items-center justify-between")}>
              <div
                className={cn(
                  "font-bold",
                  isOpen ? "text-green-800" : "text-red-800",
                )}
              >
                {room.name}
              </div>
              {isOpen ? (
                <FaToiletPaper className="text-green-800" />
              ) : (
                <FaToiletPaperSlash className="text-red-800" />
              )}
            </div>
            {isOpen && !isUsingARoom ? (
              <Button
                className="w-full"
                variant="outline"
                size="lg"
                disabled={enterMut.isLoading}
                onClick={() => {
                  void enterMut
                    .mutateAsync({ roomID: room.id, name })
                    .then(() => {
                      void rooms.refetch();
                    });
                }}
              >
                I'm In Here
              </Button>
            ) : null}
            {enteredAt != null ? (
              <div className="w-full text-center">
                <div className="text-lg font-semibold text-red-800">
                  {`${isOccupiedByMe ? "You" : "Someone"} entered `}
                  {formatDistanceToNow(enteredAt, { addSuffix: true })}
                </div>
                {waitList.length > 0 && firstWaitTime != null ? (
                  <div className="text-slate-500">
                    {waitList.length}{" "}
                    {waitList.length === 1 ? "person is" : "people are"} waiting
                    ({formatDistanceToNow(firstWaitTime)})
                  </div>
                ) : null}
                {isWaiting && numInFront === 0 ? (
                  <div className="text-slate-500">You're next</div>
                ) : null}
                {isWaiting && numInFront > 0 ? (
                  <div className="text-slate-500">
                    {numInFront} {numInFront === 1 ? "person is" : "people are"}{" "}
                    in front of you
                  </div>
                ) : null}
              </div>
            ) : null}
            {isOccupiedByMe ? (
              <Button
                variant="outline"
                size="lg"
                disabled={enterMut.isLoading}
                onClick={() => {
                  void leaveMut.mutateAsync({ roomID: room.id }).then(() => {
                    void rooms.refetch();
                  });
                }}
              >
                I'm Done
              </Button>
            ) : null}
            {!isOccupiedByMe && !isOpen && !isWaitingAny ? (
              <Button
                variant="outline"
                size="lg"
                disabled={waitMut.isLoading}
                onClick={() => {
                  void waitMut
                    .mutateAsync({ roomID: room.id, name })
                    .then(() => {
                      void rooms.refetch();
                    });
                }}
              >
                Join Waitlist
              </Button>
            ) : null}
            {isWaiting ? (
              <Button
                variant="outline"
                size="lg"
                disabled={unwaitMut.isLoading}
                onClick={() => {
                  void unwaitMut.mutateAsync({ name }).then(() => {
                    void rooms.refetch();
                  });
                }}
              >
                Leave Waitlist
              </Button>
            ) : null}
          </div>
        );
      })}
    </>
  );
}

function useLocalStorage(key: string, defaultValue: string) {
  const [value, setValue] = useState(() => {
    if (typeof window === "undefined") {
      return defaultValue;
    }
    const storedValue = window.localStorage.getItem(key);
    return storedValue ?? defaultValue;
  });

  useEffect(() => {
    window.localStorage.setItem(key, value);
  }, [key, value]);

  return [value, setValue] as const;
}

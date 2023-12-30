import { z } from "zod";
import { getWaitList, isNotPerson, isPerson } from "~/utils/utils";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const roomRouter = createTRPCRouter({
  get: publicProcedure.query(({ ctx }) => {
    return ctx.db.room.findMany();
  }),
  enter: publicProcedure
    .input(z.object({ roomID: z.number(), name: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const room = await ctx.db.room.findUnique({
        where: {
          id: input.roomID,
        },
      });
      if (room?.occupant != null) {
        throw new Error("Room is occupied");
      }
      const wl = getWaitList(room).filter((x) => x.name !== input.name);
      return ctx.db.room.update({
        where: {
          id: input.roomID,
        },
        data: {
          occupant: input.name,
          enteredAt: new Date(),
          waitList: JSON.stringify(wl),
        },
      });
    }),
  leave: publicProcedure
    .input(z.object({ roomID: z.number() }))
    .mutation(({ input, ctx }) => {
      return ctx.db.room.update({
        where: {
          id: input.roomID,
        },
        data: {
          occupant: null,
          enteredAt: null,
        },
      });
    }),
  wait: publicProcedure
    .input(z.object({ roomID: z.number(), name: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const room = await ctx.db.room.findUnique({
        where: {
          id: input.roomID,
        },
      });
      const wl = getWaitList(room);
      const byName = isPerson(input.name);
      if (wl.some(byName)) {
        throw new Error(
          `${input.name} already waiting for room ${input.roomID}`,
        );
      }
      return ctx.db.room.update({
        where: {
          id: input.roomID,
        },
        data: {
          waitList: JSON.stringify([
            ...wl,
            { name: input.name, time: new Date() },
          ]),
        },
      });
    }),
  unwait: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const rooms = await ctx.db.room.findMany({
        where: {
          waitList: {
            contains: input.name,
          },
        },
      });
      for (const room of rooms) {
        const wl = getWaitList(room);
        const n = wl.length;
        const byName = isNotPerson(input.name);
        const wl2 = wl.filter(byName);
        const nn = wl2.length;

        if (nn < n) {
          await ctx.db.room.update({
            where: {
              id: room.id,
            },
            data: {
              waitList: JSON.stringify(wl2),
            },
          });
        }
      }
    }),
});

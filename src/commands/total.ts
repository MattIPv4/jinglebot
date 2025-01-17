import {
    InteractionResponseType,
    MessageFlags,
} from "discord-api-types/payloads";
import type { Command } from "workers-discord";

import getStats from "../util/stats";
import { error, loading, notStarted, thanks } from "../util/messages";
import getNow from "../util/now";
import { bold, money, number } from "../util/format";
import type { CtxWithEnv } from "../env";
import { emojiRegular } from "../util/emoji";

const totalCommand: Command<CtxWithEnv> = {
    name: "total",
    description:
        "Check the total raised for Jingle Jam, and how many Games Collections have been claimed.",
    execute: ({ response, wait, edit, context }) => {
        wait(
            (async () => {
                const stats = await getStats(context.env.STATS_API_ENDPOINT);

                // Check if Jingle Jam is running
                const start = new Date(stats.event.start);
                const check = notStarted(start, context.env);
                if (check) return edit({ content: check });

                // Check if Jingle Jam has finished
                const end = new Date(stats.event.end);
                if (isNaN(+end)) throw new Error("Invalid end date");
                const ended = getNow() >= end;

                // Format some stats
                const totalRaised = bold(
                    money(
                        "£",
                        stats.raised.yogscast + stats.raised.fundraisers,
                    ),
                );
                const historyRaised = bold(
                    money(
                        "£",
                        stats.raised.yogscast +
                            stats.raised.fundraisers +
                            stats.history.reduce(
                                (total, year) => total + year.total.pounds,
                                0,
                            ),
                    ),
                );
                const collections = bold(number(stats.collections.redeemed));

                await edit({
                    content: [
                        `${emojiRegular(context.env, "mascot")} ${totalRaised} ${
                            ended ? "was" : "has been"
                        } raised for charity during Jingle Jam ${
                            stats.event.year
                        }${ended ? "!" : " so far!"} `,
                        `${emojiRegular(context.env, "happy")} ${collections} Games Collections ${
                            ended ? "were" : "have been"
                        } redeemed, and over all the years, we've now raised ${historyRaised}!`,
                        "",
                        thanks(end, stats.event.year, context.env),
                    ].join("\n"),
                });
            })().catch(async (err) => {
                console.error(err);
                await edit({ content: error(context.env) });
            }),
        );

        return response({
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: loading(context.env),
                flags: MessageFlags.Ephemeral,
            },
        });
    },
};

export default totalCommand;

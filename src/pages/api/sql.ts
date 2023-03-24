import type { NextApiRequest, NextApiResponse } from "next";
import { POLARIS_API_KEY } from "./.api-key-polaris";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  const r = await fetch("https://imply.api.imply.io/v1/query/sql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Basic ${POLARIS_API_KEY}:`,
    },
    body: req.body,
  });

  // const r = await fetch("http://localhost:8888/druid/v2/sql", {
  //   method: "POST",
  //   body: req.body,
  //   headers: {
  //     "Content-Type": "application/json",
  //   },
  // });

  res.status(200).json(await r.json());
}

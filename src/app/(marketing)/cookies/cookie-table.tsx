import { Badge, Table, Td, Th } from "@/components/ui";

const COOKIES = [
  {
    name: "aims_session",
    purpose: "Keeps you signed in. Revoked server-side on sign-out.",
    duration: "7 days",
    type: "Necessary",
  },
  {
    name: "aims_consent",
    purpose: "Remembers your cookie choices so the banner stops asking.",
    duration: "6 months",
    type: "Necessary",
  },
  {
    name: "aims_visitor",
    purpose: "An anonymous identifier tying a consent record to a browser, so we can evidence when consent was given.",
    duration: "12 months",
    type: "Necessary",
  },
  {
    name: "aims_analytics",
    purpose: "Aggregate page and feature usage. Set only if you accept analytics.",
    duration: "12 months",
    type: "Optional",
  },
] as const;

export function CookieTable() {
  return (
    <div className="not-prose">
      <Table>
        <thead>
          <tr>
            <Th>Cookie</Th>
            <Th>What it does</Th>
            <Th>Lasts</Th>
            <Th>Type</Th>
          </tr>
        </thead>
        <tbody>
          {COOKIES.map((cookie) => (
            <tr key={cookie.name}>
              <Td className="font-mono text-xs whitespace-nowrap">{cookie.name}</Td>
              <Td className="text-muted">{cookie.purpose}</Td>
              <Td className="whitespace-nowrap text-muted">{cookie.duration}</Td>
              <Td>
                <Badge tone={cookie.type === "Necessary" ? "brand" : "neutral"}>
                  {cookie.type}
                </Badge>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

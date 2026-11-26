import { serializeJsonLd } from "@/lib/seo/structured-data";

type JsonLdScriptProps = {
  data: unknown;
};

export function JsonLdScript({ data }: JsonLdScriptProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: serializeJsonLd(data),
      }}
    />
  );
}

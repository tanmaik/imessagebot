export default function Home() {
  return (
    <div className="p-4 text-sm w-full max-w-xl mx-auto text-left mt-8 md:mt-20 space-y-4">
      <h1 className="font-medium">iMessage Bot</h1>
      <p>
        An AI texting bot powered by{" "}
        <a
          href="https://linqapp.com"
          target="_blank"
          className="underline hover:no-underline"
        >
          Linq API
        </a>{" "}
        and{" "}
        <a
          href="https://convex.dev"
          target="_blank"
          className="underline hover:no-underline"
        >
          Convex
        </a>
        .
      </p>
      <p>
        See the{" "}
        <a
          href="https://github.com/tanmaik/imessagebot"
          target="_blank"
          className="underline hover:no-underline"
        >
          GitHub repo
        </a>{" "}
        for setup instructions.
      </p>
    </div>
  );
}

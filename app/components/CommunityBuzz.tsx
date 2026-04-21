import { MessageSquare, Heart, ExternalLink } from "lucide-react";
import Script from "next/script";


const DevToComment = ({ author, authorUrl, about, content, link, stats, profileImage }: any) => {
  return (
    <div className="relative block break-inside-avoid rounded-2xl bg-zinc-950 border border-zinc-900 hover:border-zinc-700 transition-all group overflow-hidden">
      <a 
        href={link} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="absolute inset-0 z-0" 
      />

      <div className="relative z-10 p-6 pointer-events-none">
        <div className="flex items-start gap-3 mb-4">
          <a 
            href={authorUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="pointer-events-auto flex items-start gap-3 group/author"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden bg-sky-500/10 border border-zinc-800 group-hover/author:border-sky-500/50 transition-colors flex-shrink-0">
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt={author} 
                  className="w-full h-full object-cover grayscale group-hover/author:grayscale-0 transition-all duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-sky-500 uppercase">
                  {author[0].toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <span className="text-xs font-bold text-zinc-200 group-hover/author:text-sky-400 transition-colors">
                {author}
              </span>
              <span className="text-[10px] text-zinc-500 leading-tight mt-0.5 line-clamp-1 max-w-[220px]">
                {about || "Dev.to Contributor"}
              </span>
            </div>
          </a>
          
          <ExternalLink className="w-3 h-3 text-zinc-800 ml-auto group-hover:text-zinc-400 transition-colors" />
        </div>

        {/* --- FIXED: Added whitespace-pre-line to respect paragraphs --- */}
        <p className="text-sm text-zinc-400 leading-relaxed italic mb-4 whitespace-pre-line">
          {content}
        </p>
      </div>
    </div>
  );
};
export default function CommunityBuzz() {
  return (
    <section className="py-24 px-6 bg-black border-t border-zinc-900">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">Community Feedback</h2>
          {/* <p className="text-zinc-500 text-sm">Authentic feedback from the global developer ecosystem.</p> */}
        </div>

        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          
          {/* 1. NATIVE REDDIT EMBED CONTAINER */}
         <div className="break-inside-avoid rounded-2xl overflow-hidden p-1 bg-zinc-950 border border-zinc-900">
            <blockquote 
                className="reddit-embed-bq" 
                data-embed-theme="dark" 
                data-embed-height="260"
            >
                <a href="https://www.reddit.com/r/reactjs/comments/1si4sam/comment/ofi4yrs/">Comment</a>
                <br /> by {/* React needs the slash at the end of br */}
                <a href="https://www.reddit.com/user/red_it__/">u/red_it__</a> from discussion
                <a href="https://www.reddit.com/r/reactjs/comments/1si4sam/i_built_a_react_hook_for_webgpu_local_inference/"></a>
                <br /> in
                <a href="https://www.reddit.com/r/reactjs/">reactjs</a>
            </blockquote>

            {/* Use the Next.js Script component instead of raw <script> */}
            <Script 
                src="https://embed.reddit.com/widgets.js" 
                strategy="afterInteractive" 
            />
         </div>
  
        <div className="break-inside-avoid rounded-2xl overflow-hidden p-1 bg-zinc-950 border border-zinc-900">
            <blockquote 
            className="reddit-embed-bq" 
            data-embed-theme="dark" 
            data-embed-showedits="false" 
            data-embed-created="2026-04-21T20:19:12.662Z" 
            data-embed-height="220"
            >
            <a href="https://www.reddit.com/r/reactjs/comments/1si4sam/comment/ofp5udv/">Comment</a>
            <br /> by {/* Fixed: self-closing tag */}
            <a href="https://www.reddit.com/user/red_it__/">u/red_it__</a> from discussion
            <a href="https://www.reddit.com/r/reactjs/comments/1si4sam/i_built_a_react_hook_for_webgpu_local_inference/"></a>
            <br /> in {/* Fixed: self-closing tag */}
            <a href="https://www.reddit.com/r/reactjs/">reactjs</a>
            </blockquote>

            {/* Handled by Next.js Script Loader */}
            <Script 
            src="https://embed.reddit.com/widgets.js" 
            strategy="afterInteractive" 
            />
        </div>
    
          {/* 2. CUSTOM DEV.TO CARD */}
          <DevToComment 
            author="Victor Okefie"
            about="Founder @ Eptopia"
            profileImage="https://media2.dev.to/dynamic/image/width=320,height=320,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Fuser%2Fprofile_image%2F1825387%2Fa10397d1-f0a4-40ff-8a43-0aebfa0eca9e.png"
            authorUrl="https://dev.to/theeagle" // The new link to their profile
            content={`The constraint you named honestly: "This is not for lightweight, general-purpose landing pages." Most libraries hide the 3GB download. You put it upfront. That's not a bug, it's a filter. The use cases that survive that constraint are the ones that actually need local inference: B2B dashboards, enterprise data privacy, structured extraction. Everything else falls away. That's good product design. You built for the problem, not the demo.`}
            link="https://dev.to/theeagle/comment/36jnk" // The link to the actual comment
            // stats="124"
        />
          <DevToComment 
            author="Knowband"
            about="eCommerce plugin development company"
            profileImage="https://media2.dev.to/dynamic/image/width=320,height=320,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Fuser%2Fprofile_image%2F3816357%2F178405a6-f93e-4264-a1f6-6896ab5f9340.jpg"
            authorUrl="https://dev.to/scott_morrison_39a1124d85" // The new link to their profile
            content={`Really solid abstraction of a genuinely painful setup, wrapping WebGPU, workers, and caching into a simple hook is a big DX win. I especially like the honest positioning around when it actually makes sense, the B2B and privacy use cases are spot on.`}
            link="https://dev.to/scott_morrison_39a1124d85/comment/36kbc" // The link to the actual comment
            // stats="124"
        />  
          <DevToComment 
            author="mote"
            about="Embedded multi-modal database for edge AI"
            profileImage="https://media2.dev.to/dynamic/image/width=320,height=320,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Fuser%2Fprofile_image%2F3796371%2Fa075a83c-f1f4-41e4-ab40-7b42a4fe6565.png"
            authorUrl="https://dev.to/motedb"
            content={`WebGPU for local inference is the right direction. We hit a similar problem building data infrastructure for edge AI — when your robot needs to make decisions in under 50ms, round-tripping to an API is not even an option.

The 1.5-3GB model download concern you mentioned is real though. In our case we solved it by shipping a smaller quantized model (Q4) as part of the binary itself. The tradeoff is accuracy vs. startup time, but for many edge use cases that tradeoff makes sense.

One question: how does react-brai handle tab-level coordination? If a user has 3 tabs open, do they each download their own model copy? That was a nasty issue we had with Web Workers — each worker loading its own model into memory and OOM-killing the browser.
`}
            link="https://dev.to/motedb/comment/36jl0" // The link to the actual comment
            // stats="124"
        />  

          {/* Add more as needed... */}
        </div>
      </div>
    </section>
  );
}
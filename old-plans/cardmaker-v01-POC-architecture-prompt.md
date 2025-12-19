This is an original, out of date prompt. Keeping it here for reference but please ignore specifics e.g gooten and webflow.

We're building a product that lets a user request images be generated for greeing cards and iterate on them. This is v0.1, the Proof of Concept version, but I will make high-level notes about future versions here.

Let's build a high-level architecture for this product.


Goals for v0.1 POC:
- User provides text prompt to generate an image
- Website (via our backend) uses an existing image generation technology to generate a 5x7 image for them based on that prompt. If the image can't be 5x7 exactly we fit it to a 5x7 window.
- User can click "buy"

Technology preferences:
I'll list platforms I'm familiar with. All things being equal I would prefer these but if there are better options you should tell me. I currently have a simple e-commerce business that sells greeting cards. Here is the architecture I'm using for it.
- Product tracking and orders - shopify.
- Frontend - we use a Webflow website and not the default shopify storefront. However when the user checks out it DOES use shopify's web pages so we do need to configure those via shopify.
- Our Shopify backend syncs to our Webflow site via Smootify, a saas product. More info about Smootify at https://docs.smootify.io
- Currently our one supplier is Gooten, a print-on-demand company. It's hooked to Shopify via their shopify app.

It would be great if I could continue using Gooten for fulfillment and Shopify for product tracking and all its other features. But I don't know if those platforms support our goals. I don't really care if we use Webflow or Smoothify for our frontend.

I am fammiliar with Memberstack but I'm not sure if we need it right now.

In any order
- They are directed to a shopify-served checkout page (usually found at a url like [mywebsite].shop.com)
- The order is processed by Gooten
- The order is tracked by Shopify.

The Gooten docs are at https://help.gooten.com/hc/en-us
Shopify docs are at https://shopify.dev/docs

I don't want to get into tech much in this planning phase but here are requirements:
- modularize the image generation part so that I can prototype with AWS Bedrock and the models it supports but later easily swap in another model like Flux, DALL-E, or OpenAI or another AI platform aggregator.
- Build some guardrails so we can't accidentally place a bunch of orders during this POC phase and owe lots of money
- Access should be limited to developers and our machines. Right now it's just me and you, Claude.
-

I am familiar with selling static products such as greeting cards using Shopify+Gooten. However I'm unfamiliar with selling custom user-created products on these platforms.


Future features:
v0.2 - alpha
- Checking for copyright violations created by user requests

v0.3 - beta
- User can request changes to image
- Shopping cart with multiple created cards


v1.0 - shipping version with all above features

Future versions
- User can create a folded greeting card where they can provide images for 3 of the 4 pages
- Tracking users' previous orders
- Letting users order more of their previous designs
- Feedback form impervous to spam and bots

Let's track the plan in a document named
cardmaker-v01-POC-plan



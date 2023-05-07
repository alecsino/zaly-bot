# Zaly-bot - Conceptual Approach with Third Server Integration
This project aims to showcase a novel approach to automating purchases on the platform using a third server integration. In this way the server can send really fast requests to obtain the status of the product, and the client is not rate limited. This may lead to better performance when failing a buy or during restocks.

The general idea is that the client only performs the buying, whilst the server performs large numbers of request without being logged in, thus avoiding bans.

## Components
1. **Server**: The server component is responsible for monitoring the availability of desired products on the platform. It acts as a trigger to initiate the purchase process as soon as the product becomes available.

2. **Extension**: A Chrome extension that provides an interface to configure the bot's settings. You can specify product details, such as brand, category, size, and color.

3. **Client**: A Node.js client that allows for debugging and manual interactions with the bot. You can use the client to check the bot's status and update the configuration.

## Disclaimer
This has not been thoroughly tested, and it is not intended to be used. More over every request has been designed for the 2022 API version, and I do not know if it will still work today.
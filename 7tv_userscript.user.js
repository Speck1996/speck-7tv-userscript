// ==UserScript==
// @name         7TV and More Emotes for Twitch
// @version      1.2
// @description  Display 7TV, BTTV, and FFZ emotes in Twitch chat considering case sensitivity.
// @author       Speck
// @match        https://www.twitch.tv/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(async function() {
    'use strict';

    // Initialize an empty map for emotes
    let emotes = new Map();
    
    function getChannelName() {
        // This assumes the URL is always in the format of "https://www.twitch.tv/[channelname]"
        const pathSegments = window.location.pathname.split('/').filter(Boolean);
        return pathSegments[0]; // The first segment after the domain name should be the channel name
    }

    // Function to fetch and store emote data
    async function loadEmotes(channelName) {
        try {
            const response = await fetch(`https://emotes.adamcy.pl/v1/channel/${channelName}/emotes/twitch.7tv.bttv.ffz`);
            const data = await response.json();
            // Store emotes without altering their case
            emotes = new Map(data.map(emote => [emote.code, emote.urls[0].url]));
        } catch (error) {
            console.error('Failed to load emotes:', error);
        }
    }

    // Call loadEmotes immediately to fetch emotes
    const channelName = getChannelName();
    await loadEmotes(channelName);

    // Function to replace emote text with images, respecting case sensitivity
    // Modified function to replace emote text with images, including hover overlay
// Improved function to replace emote text with images without disrupting existing elements
// Improved function to replace emote text with images without disrupting existing elements
    const replaceEmotes = (node) => {
        if (!emotes.size) return;

        const walk = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null, false);
        let textNode;
        while (textNode = walk.nextNode()) {
            emotes.forEach((url, code) => {
                const regex = new RegExp(`\\b${code}\\b`, 'g');
                if (regex.test(textNode.nodeValue)) {
                    const frag = document.createDocumentFragment();
                    const parts = textNode.nodeValue.split(regex);

                    parts.forEach((part, index) => {
                        frag.appendChild(document.createTextNode(part));
                        if (index < parts.length - 1) {
                            // Create a button element for the emote
                            const emoteButton = document.createElement('button');
                            emoteButton.style.background = 'none';
                            emoteButton.style.border = 'none';
                            emoteButton.style.cursor = 'pointer';
                            emoteButton.style.padding = '0';
                            emoteButton.setAttribute('title', code); // Default tooltip

                            // Create an image element for the emote
                            const emoteElement = document.createElement('img');
                            emoteElement.src = url;
                            emoteElement.alt = code;
                            emoteElement.style.height = '28px';

                            emoteButton.appendChild(emoteElement);

                            // Event listeners for displaying the emote code
                            const displayEmoteCode = (show) => {
                                if (show) {
                                    emoteButton.style.position = 'relative';
                                    const tooltip = document.createElement('div');
                                    tooltip.textContent = code;
                                    tooltip.style.position = 'absolute';
                                    tooltip.style.left = '0';
                                    tooltip.style.bottom = '100%'; // Display above the button
                                    tooltip.style.background = 'white';
                                    tooltip.style.color = 'black';
                                    tooltip.style.padding = '2px 5px';
                                    tooltip.style.borderRadius = '4px';
                                    tooltip.style.whiteSpace = 'nowrap';
                                    tooltip.style.fontSize = '12px';
                                    tooltip.style.zIndex = '1'; // Ensure tooltip is above other content
                                    tooltip.className = 'custom-emote-tooltip'; // For styling or removal
                                    emoteButton.appendChild(tooltip);
                                } else {
                                    const existingTooltip = emoteButton.querySelector('.custom-emote-tooltip');
                                    if (existingTooltip) {
                                        existingTooltip.remove();
                                    }
                                }
                            };

                            // Attach event listeners to the button
                            emoteButton.addEventListener('mouseenter', () => displayEmoteCode(true));
                            emoteButton.addEventListener('mouseleave', () => displayEmoteCode(false));

                            frag.appendChild(emoteButton);
                        }
                    });

                    textNode.parentNode.replaceChild(frag, textNode);
                }
            });
        }
    };


    // Modified version of the replaceEmotes function to use event delegation for tooltips
    const replaceEmotesWithDelegation = (chatContainer) => {
        chatContainer.addEventListener('mouseover', (e) => {
            if (e.target.tagName.toLowerCase() === 'img' && e.target.alt) {
                showTooltip(e, e.target.alt); // Use the alt attribute (emote code) for the tooltip
            }
        });

        chatContainer.addEventListener('mouseout', (e) => {
            if (e.target.tagName.toLowerCase() === 'img' && e.target.alt) {
                hideTooltip();
            }
        });
    };

    // Observe Twitch chat for new messages
    const chatObserver = new MutationObserver((mutations) => {
        mutations.forEach(({ addedNodes }) => {
            addedNodes.forEach(node => {
                if (node.nodeType === 1 && (node.classList.contains('chat-line__message') || node.querySelector('.chat-line__message'))) {
                    replaceEmotes(node);
                }
            });
        });
    });

    // Start observing
    const chatContainer = document.querySelector('.chat-scrollable-area__message-container');
    if (chatContainer) {
        chatObserver.observe(chatContainer, { childList: true, subtree: true });
    } else {
        console.error('Twitch chat container not found.');
    }
})();

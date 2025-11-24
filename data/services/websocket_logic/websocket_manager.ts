import { BaseError, HTTP404Error, HTTP500Error } from "../middleware/error_handling/standard_errors.middleware";
import WebSocket, { RawData } from 'ws';

// TODO: sometimes a connection could be closed without actually triggering the 'close' event. Implement some type of "heartbeat" system to close stale connections.
const WebSocketError = {
    ECONNREFUSED: "ECONNREFUSED",
    ETIMEDOUT: "ETIMEDOUT",
    ENOTFOUND: "ENOTFOUND",
    ECONNRESET: "ECONNRESET",
    EHOSTUNREACH: "EHOSTUNREACH",
    EPIPE: "EPIPE"
} as const

type WebSocketError = typeof WebSocketError[keyof typeof WebSocketError]

class WebSocketManager {
    // Stores the ESTABLISHED connections.
    private connections = new Map<string, WebSocket>();
    // Stores the Promises of connections that are being actively attempted to be established.
    private pendingConnections = new Map<string, Promise<WebSocket | undefined | BaseError>>()

    private readonly _timeOutSeconds: number = 5
    // private readonly _heartBeatInervalSeconds: number = 30

    private readonly _errorDescriptions: Record<WebSocketError, string> = {
        ECONNREFUSED: "Cannot connect to server (connection refused). Are you sure the server is running?",
        ETIMEDOUT: "Connection timed out. The server is too slow or unreachable.",
        ENOTFOUND: "Server address not found (DNS error).",
        ECONNRESET: "Connection was closed unexpectedly.",
        EHOSTUNREACH: "Server cannot be reached from this network.",
        EPIPE: "Broken connection to the server."
    };

    /**
     * @description - This function lets you establish a WebSocket, given the IP and Port of a WebSocket Server. If a connection is already established to the specified URL, the method will just give you back the already opened WebSocket.
     * @param {string} ip - IP Address of the Websocket 
     * @param {number} port - Port of the WebSocket
     * @returns {Promise<WebSocket | undefined | BaseError>} - The Promise of a connected and functioning WebSocket, or an error/undefined.
     */
    async getConnection(ip: string, port: number): Promise<WebSocket | undefined | BaseError> {
        // The URL for the connection is always "ws://ip:port"
        const url = `ws://${ip}:${port}`
        const existing = this.connections.get(url);

        // If we already have an existing connection already established for that specific URL, then
        // we just give that existing connection back; no need to create a new one.
        if (existing && existing.readyState === WebSocket.OPEN) return existing;

        // Check for a pending connection for the specifc given URL: a connection to the same URL may have
        // been already tried but it's not OPEN/ready yet. Just wait for the connection to be established
        // (or wait for it to result in a definitive error). To achieve this, just return 
        // the Promise of that connection attempt.
        const pending = this.pendingConnections.get(url);
        if (pending) return pending;

        // If no pending connection for the URL exists, start the connection attempt. 
        const connectPromise = this.connect(url);
        this.pendingConnections.set(url, connectPromise);

        try {
            // Try and return the connection once its established (or once its definitive
            // that it cannot be established)
            const t = await connectPromise;
            return t;
        } finally {
            // Always clean-up the pendingConnections Map. Even if a connection doesn't happen 
            // for whatever reason (even unexpected exceptions), the pending attempt is still 
            // done and has to be removed from the map.
            this.pendingConnections.delete(url);
        }
    }

    // Given a URL, tries to establish a WebSocket connection.
    private async connect(url: string) {
        const ws: WebSocket = new WebSocket(url);
        const waitResult = await this.waitForOpen(ws);

        // If the waitResult is an Error or undefined, the connection failed for some reason.
        if (waitResult instanceof BaseError || !waitResult) return waitResult;

        // If we reach this point, the connection was successful so, we can store 
        // it in the connections map.
        this.connections.set(ws.url, ws);
        return waitResult;
    }

    // Waits for a WebSocket to be opened, or for it to fail. If nothing happens within a specific
    // timeout, an error is returned. It also handles the clean-up of the connections map when the WebSocket closes.
    private async waitForOpen(ws: WebSocket) {
        // We begin a Promise Race: if the socket fails to connect within the timeout, 
        // an error is returned.
        return await Promise.race([
            new Promise<WebSocket | undefined | BaseError>((resolve) => {
                // If the given WebSocket is already opened, there's nothing to wait.
                // Resolve the Promise immedietly
                if (ws.readyState === WebSocket.OPEN) resolve(ws)
                else {
                    // If the WebSocket is not open, then wait for an "open" or
                    // "error" event to resolve the Promise.
                    ws.once('open', () => resolve(ws) );
                    ws.once('error', (err) => resolve(this.describeError(err)));

                    // Also the WebSocket is told to delete itself from the connections
                    // map whenever it eventually closes (this also includes the
                    // case in which the WebSocket actually cannot connect and so
                    // the Promise resolves in an error).
                    ws.once('close', () => this.connections.delete(ws.url))
                }
            }),
            // If the main promise that tries to resolve when the WebSocket is connected, hangs for more than
            // _timeOutSeconds time, we just consider the connection failed. We resolve this other 
            // Promise with an Error that specifies that the connection attempt timed out.
            new Promise<BaseError>((resolve) =>
                setTimeout(() => {
                    resolve(new HTTP500Error(this._errorDescriptions[WebSocketError.ETIMEDOUT]))
                },
            this._timeOutSeconds * 1000)
                // setTimeout(() => ws.emit('error', WebSocketError.ETIMEDOUT), this._timeOutSeconds * 1000)
            ),
        ])
    }

    // Utility method to translate 'raw' errors from a WebSocket to a more readable format.
    private describeError(e: any): BaseError | undefined {
        if (!e) return undefined;
        // If the error is null, undefined, or doesnt have a "code" property
        // the error is of "undefined" type, otherwise, just use the code.
        const code = (e?.code ?? e) as WebSocketError;
        // If the code is in the "errorDescriptions" record use that, 
        // otherwise it's an undefined error. If for some reason the error has 
        // no message property, we dont add it to the final message.
        const msg = this._errorDescriptions[code] + (e.message ? ` Raw Error: ${e.message}` : '') || undefined;
        return (msg) ? new HTTP500Error(msg) : undefined
    }


    /**
     * @description - This function lets you send a string into a WebSocket. If the WebSocket is not already established, it establishes it.
     * @param {string} ip - IP Address of the Websocket 
     * @param {number} port - Port of the WebSocket
     * @param {string} dataToSend - The data to send in the WebSocket
     * @returns {Promise<string | undefined | BaseError>} - The response of the WebSocket in string format, or an error/undefined.
     */
    async connectAndSend(ip: string, port: number, dataToSend: string): Promise<string | undefined | BaseError> {
        const ws = await this.getConnection(ip, port);
        // If we get back an Error or undefined from the connection, the
        // connection failed for some reason. We cannot send any data in this
        // state, so we just end the method here returning the error/undefined.
        if (ws instanceof BaseError || !ws) return ws

        return await this.sendToSocket(ws, dataToSend)
    }

    /**
     * @description Given an already established WebSocket, it send data to it.
     * @param {WebSocket} ws - An already established WebSocket
     * @param {string} dataToSend - The data to send in the WebSocket
     * @returns {Promise<string | BaseError>} - The response of the WebSocket in string format, or an error.
     */
    async sendToSocket(ws: WebSocket, dataToSend: string): Promise<string | BaseError> {
        // If the WebSocket is not open, no data can be sent. Return an error.
        if (ws.readyState !== ws.OPEN) return new HTTP500Error("The WebSocket is not open. No data could be sent.")

        // The data is sent to the WebSocket
        ws.send(dataToSend)

        // We begin a Promise Race: if the socket doesnt return a response within
        // the timeout, an error is returned.
        return Promise.race([
            new Promise<string>((resolve) => {
                // A one-time "message" listener is given to the WebSocket; if a message
                // is given back from the WebSocket, the function is triggered.
                ws.once("message", (data) => {
                    resolve(this.rawDataToString(data))
                })
            }),
            // If the main promise that tries to resolve when the WebSocket returns data hangs for more than
            // _timeOutSeconds time, we just consider the interaction failed. We resolve this other 
            // Promise with an Error that specifies that the connection attempt timed out.
            new Promise<BaseError>((resolve) =>
                setTimeout(() => resolve(new HTTP500Error(this._errorDescriptions[WebSocketError.ETIMEDOUT])), this._timeOutSeconds * 1000)
            ),
        ])
    }

    // Utility method that translates RawData received from the WebSocket to a string.
    private rawDataToString(data: RawData): string {
        // The data could be given in various different formats. This 
        // translates it from those formats to a string.
        if (typeof data === 'string') return data;
        if (data instanceof Buffer) return data.toString('utf-8');
        if (data instanceof ArrayBuffer) return Buffer.from(data).toString('utf-8');
        if (Array.isArray(data)) return Buffer.concat(data).toString('utf-8');
        return String(data);
    }

    /**
     * @description - This function lets you listen to message received by the WebSocket. If the WebSocket is not already established, it establishes it.
     * @param {string} ip - IP Address of the Websocket 
     * @param {number} port - Port of the WebSocket
     * @param callback - The callback function that is called whenever a messages is received from the WebSocket. The data received is given as a string parameter to the callback.
     * @returns A function to unsubscribe the listener when done, or an error/undefined if connection failed.
     */
    async connectAndReceive(ip: string, port: number, callback: (data: string) => any) {
        const ws = await this.getConnection(ip, port)
        // If we get back an Error or undefined from the connection, the
        // connection failed for some reason. We cannot receive any data in this
        // state, so we just end the method here returning the error/undefined.
        if (ws instanceof BaseError || !ws) return ws

        const sendData = (rawData: RawData) => {
            // Instead of giving back the RawData directly to the callback function,
            // we first translate it to a string with the 'rawDataToString' utility method.
            callback(this.rawDataToString(rawData));
        }
        ws.on("message", sendData);

        // Auto-cleanup on close
        // const cleanup = () => ws.off("message", callback);
        // ws.once("close", cleanup);

        // This is the 'unsubscribe' function to remove the listener when no longer needed.
        return () => {
            ws.off("message", sendData);
            //ws.off("close", cleanup);
        };
    }

    /**
     * @description Manually closes an already established WebSocket connection.
     * @param {string} ip - IP Address of the Websocket
     * @param {number} port - Port of the WebSocket
     * @returns 
     */
    async manuallyCloseConnection(ip: string, port: number) {
        const url = `ws://${ip}:${port}`;
        const ws = this.connections.get(url);

        // If the WebSocket is an Error, undefined, or simply not open, there's nothing to close.
        if (ws instanceof BaseError || !ws || ws.readyState !== ws.OPEN)
            return ws;

        ws.close();
        // No need to manually delete the connection from the map, as the 'close' event will take care of that.
    }

    /**
     * @description Manually closes all established WebSocket connections.
     */
    // TODO: in this way, exceptions are ignored. Should I care?
    async manuallyCloseAllConnections() {
        for (const ws of this.connections.values()) 
            if (ws.readyState === ws.OPEN) ws.close();
    }
}

export default new WebSocketManager();


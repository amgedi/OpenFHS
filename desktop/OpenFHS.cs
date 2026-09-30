// Minimal offline Windows launcher. Embedded static assets; no diary data API.
// Build from source with build-windows.ps1. SPDX-License-Identifier: AGPL-3.0-only.
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Reflection;
using System.Text;
using System.Threading;
using System.Windows.Forms;

internal static class OpenFHS
{
    private const int Port = 4318;
    private const string Address = "http://127.0.0.1:4318/";
    private static TcpListener listener;
    private static volatile bool running;
    private static readonly SemaphoreSlim slots = new SemaphoreSlim(16);
    private static readonly Dictionary<string, string[]> Files = new Dictionary<string, string[]> {
        { "/logo.svg", new[] { "logo.svg", "image/svg+xml" } },
        { "/avatars.js", new[] { "avatars.js", "text/javascript" } },
        { "/privacy.js", new[] { "privacy.js", "text/javascript" } },
        { "/backup.js", new[] { "backup.js", "text/javascript" } },
        { "/languages.js", new[] { "languages.js", "text/javascript" } },
        { "/", new[] { "index.html", "text/html" } },
        { "/index.html", new[] { "index.html", "text/html" } },
        { "/styles.css", new[] { "styles.css", "text/css" } },
        { "/core.js", new[] { "core.js", "text/javascript" } },
        { "/features.js", new[] { "features.js", "text/javascript" } },
        { "/media.js", new[] { "media.js", "text/javascript" } },
        { "/experience.js", new[] { "experience.js", "text/javascript" } },
        { "/app.js", new[] { "app.js", "text/javascript" } }
    };

    [STAThread]
    private static void Main(string[] args)
    {
        bool headless = Array.IndexOf(args, "--headless") >= 0;
        bool created;
        using (var singleInstance = new Mutex(true, "Local\\OpenFHSOfflinePractice4318", out created))
        {
            if (!created) { if (!headless) Process.Start(Address); return; }
            try
            {
                listener = new TcpListener(IPAddress.Loopback, Port);
                listener.ExclusiveAddressUse = true;
                listener.Start(16);
                running = true;
                var serverThread = new Thread(AcceptLoop); serverThread.IsBackground = true; serverThread.Start();
                if (headless) { serverThread.Join(); return; }
                Application.EnableVisualStyles();
                using (var tray = new NotifyIcon())
                using (var menu = new ContextMenuStrip())
                {
                    menu.Items.Add("Open practice diary", null, (sender, e) => Process.Start(Address));
                    menu.Items.Add("Exit OpenFHS", null, (sender, e) => Application.Exit());
                    using (var iconStream = Assembly.GetExecutingAssembly().GetManifestResourceStream("OpenFHS.icon"))
                    using (var icon = new Icon(iconStream)) tray.Icon = (Icon)icon.Clone();
                    tray.Text = "OpenFHS — offline practice diary";
                    tray.ContextMenuStrip = menu; tray.Visible = true;
                    tray.DoubleClick += (sender, e) => Process.Start(Address);
                    Process.Start(Address);
                    Application.Run();
                    tray.Visible = false;
                }
            }
            catch (Exception error)
            {
                if (!headless) MessageBox.Show("OpenFHS could not start. Another program may be using port 4318.\n\n" + error.Message, "OpenFHS", MessageBoxButtons.OK, MessageBoxIcon.Information);
                Environment.ExitCode = 1;
            }
            finally { running = false; if (listener != null) listener.Stop(); }
        }
    }

    private static void AcceptLoop()
    {
        while (running)
        {
            TcpClient client;
            try { client = listener.AcceptTcpClient(); }
            catch (SocketException) { return; }
            catch (ObjectDisposedException) { return; }
            if (!slots.Wait(0)) { client.Close(); continue; }
            ThreadPool.QueueUserWorkItem(_ => { try { Serve(client); } finally { slots.Release(); } });
        }
    }

    private static void Serve(TcpClient client)
    {
        using (client)
        {
            client.ReceiveTimeout = 5000; client.SendTimeout = 5000;
            try
            {
                using (NetworkStream stream = client.GetStream())
                {
                    var header = new List<byte>();
                    bool complete = false;
                    while (header.Count < 8192)
                    {
                        int value = stream.ReadByte(); if (value < 0) return; header.Add((byte)value);
                        int n = header.Count;
                        if (n >= 4 && header[n - 4] == 13 && header[n - 3] == 10 && header[n - 2] == 13 && header[n - 1] == 10) { complete = true; break; }
                    }
                    if (!complete) { Reply(stream, 431, "Request headers too large", false); return; }
                    string[] lines = Encoding.ASCII.GetString(header.ToArray()).Split(new[] { "\r\n" }, StringSplitOptions.None);
                    string[] request = lines[0].Split(' ');
                    if (request.Length != 3 || request[2] != "HTTP/1.1") { Reply(stream, 400, "Bad request", false); return; }
                    string host = null;
                    foreach (string line in lines)
                    {
                        if (line.StartsWith("Host:", StringComparison.OrdinalIgnoreCase))
                        {
                            if (host != null) { Reply(stream, 400, "Duplicate Host", false); return; }
                            host = line.Substring(5).Trim();
                        }
                    }
                    if (host != "127.0.0.1:" + Port) { Reply(stream, 403, "Local requests only", false); return; }
                    bool head = request[0] == "HEAD";
                    if (!head && request[0] != "GET") { Reply(stream, 405, "Read-only preview", false); return; }
                    string route = request[1].Split('?')[0]; string[] asset;
                    if (!Files.TryGetValue(route, out asset)) { Reply(stream, 404, "Not found", head); return; }
                    using (Stream resource = Assembly.GetExecutingAssembly().GetManifestResourceStream("OpenFHS." + asset[0]))
                    {
                        if (resource == null) { Reply(stream, 500, "Missing embedded asset", head); return; }
                        using (var bytes = new MemoryStream())
                        {
                            resource.CopyTo(bytes);
                            Write(stream, 200, asset[1] + "; charset=utf-8", bytes.ToArray(), head);
                        }
                    }
                }
            }
            catch (IOException) { /* Client closed the connection or timed out. */ }
            catch (SocketException) { /* Client disconnected. */ }
        }
    }
    private static void Reply(NetworkStream stream, int status, string message, bool head)
    {
        Write(stream, status, "text/plain; charset=utf-8", Encoding.UTF8.GetBytes(message), head);
    }
    private static void Write(NetworkStream stream, int status, string contentType, byte[] bytes, bool head)
    {
        string headers = "HTTP/1.1 " + status + (status == 200 ? " OK" : " Error") + "\r\n" +
            "Content-Type: " + contentType + "\r\nContent-Length: " + bytes.Length + "\r\n" +
            "Connection: close\r\nCache-Control: no-store\r\nX-Content-Type-Options: nosniff\r\n" +
            "X-OpenFHS-Build: 0.5.8-alpha.11-offline\r\n" +
            "Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; media-src 'self' blob:; connect-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'\r\n\r\n";
        byte[] encoded = Encoding.ASCII.GetBytes(headers); stream.Write(encoded, 0, encoded.Length);
        if (!head) stream.Write(bytes, 0, bytes.Length);
    }
}

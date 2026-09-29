# Render the code-native cat mark for Windows; no external graphics dependencies.
param([Parameter(Mandatory=$true)][string]$OutputPath)
Add-Type -AssemblyName System.Drawing
$bitmap = New-Object System.Drawing.Bitmap 64,64
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.ScaleTransform(0.5333333,0.5333333)
$shape = New-Object System.Drawing.Drawing2D.GraphicsPath
$shape.AddLines([System.Drawing.PointF[]]@([System.Drawing.PointF]::new(15,70),[System.Drawing.PointF]::new(15,10),[System.Drawing.PointF]::new(40,30)))
$shape.AddBezier(40,30,50,20,70,20,80,30)
$shape.AddLine(80,30,105,10)
$shape.AddLine(105,10,105,70)
$shape.AddBezier(105,70,100,120,20,120,15,70)
$shape.CloseFigure()
$coat = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#9db399'))
$ink = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml('#294e43')),5
$graphics.FillPath($coat,$shape)
$graphics.DrawArc($ink,30,52,20,16,0,180)
$graphics.DrawArc($ink,70,52,20,16,0,180)
$nose = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#294e43'))
$graphics.FillPolygon($nose,[System.Drawing.PointF[]]@([System.Drawing.PointF]::new(53,78),[System.Drawing.PointF]::new(67,78),[System.Drawing.PointF]::new(60,85)))
$icon = [System.Drawing.Icon]::FromHandle($bitmap.GetHicon())
$stream = [System.IO.File]::Create($OutputPath)
try { $icon.Save($stream) } finally { $stream.Dispose(); $icon.Dispose(); $graphics.Dispose(); $bitmap.Dispose(); $shape.Dispose(); $coat.Dispose(); $ink.Dispose(); $nose.Dispose() }

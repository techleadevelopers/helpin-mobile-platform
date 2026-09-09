Add-Type -AssemblyName System.Drawing

$sourcePath = Join-Path $PSScriptRoot '..\artifacts\mobile\assets\images\icon.png'
$outputPath = Join-Path $PSScriptRoot '..\artifacts\mobile\assets\images\adaptive-icon-foreground.png'
$source = [System.Drawing.Bitmap]::FromFile($sourcePath)

try {
  $bounds = [System.Drawing.Rectangle]::Empty
  for ($y = 0; $y -lt $source.Height; $y++) {
    for ($x = 0; $x -lt $source.Width; $x++) {
      $pixel = $source.GetPixel($x, $y)
      $luminance = (0.2126 * $pixel.R) + (0.7152 * $pixel.G) + (0.0722 * $pixel.B)
      if ($luminance -lt 230) {
        if ($bounds.IsEmpty) { $bounds = [System.Drawing.Rectangle]::new($x, $y, 1, 1) }
        else { $bounds = [System.Drawing.Rectangle]::Union($bounds, [System.Drawing.Rectangle]::new($x, $y, 1, 1)) }
      }
    }
  }

  $canvas = [System.Drawing.Bitmap]::new(1024, 1024, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  try {
    $graphics = [System.Drawing.Graphics]::FromImage($canvas)
    try {
      $graphics.Clear([System.Drawing.Color]::Transparent)
      $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

      # Keep the paw inside Android's adaptive-icon safe zone.
      $targetSize = 440
      $scale = $targetSize / [Math]::Max($bounds.Width, $bounds.Height)
      $targetWidth = [int][Math]::Round($bounds.Width * $scale)
      $targetHeight = [int][Math]::Round($bounds.Height * $scale)
      $target = [System.Drawing.Rectangle]::new(
        [int](($canvas.Width - $targetWidth) / 2),
        [int](($canvas.Height - $targetHeight) / 2),
        $targetWidth,
        $targetHeight
      )

      $mask = [System.Drawing.Bitmap]::new($bounds.Width, $bounds.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
      try {
        for ($y = 0; $y -lt $bounds.Height; $y++) {
          for ($x = 0; $x -lt $bounds.Width; $x++) {
            $pixel = $source.GetPixel($bounds.X + $x, $bounds.Y + $y)
            $luminance = (0.2126 * $pixel.R) + (0.7152 * $pixel.G) + (0.0722 * $pixel.B)
            $alpha = [Math]::Min(255, [Math]::Max(0, [int][Math]::Round((255 - $luminance) * 1.4)))
            $mask.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, 31, 32, 32))
          }
        }
        $graphics.DrawImage($mask, $target)
      } finally {
        $mask.Dispose()
      }
      $canvas.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
      $graphics.Dispose()
    }
  } finally {
    $canvas.Dispose()
  }
} finally {
  $source.Dispose()
}

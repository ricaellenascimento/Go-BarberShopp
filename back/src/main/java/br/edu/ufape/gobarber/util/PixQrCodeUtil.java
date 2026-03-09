package br.edu.ufape.gobarber.util;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;

public final class PixQrCodeUtil {

    private static final int QR_SIZE = 300;

    private PixQrCodeUtil() {
    }

    public static String toBase64Png(String payload) {
        if (payload == null || payload.trim().isEmpty()) {
            return null;
        }

        try {
            BitMatrix matrix = new QRCodeWriter().encode(
                    payload.trim(),
                    BarcodeFormat.QR_CODE,
                    QR_SIZE,
                    QR_SIZE
            );
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", output);
            return Base64.getEncoder().encodeToString(output.toByteArray());
        } catch (WriterException | IOException e) {
            throw new IllegalArgumentException("Nao foi possivel gerar o QR Code PIX.", e);
        }
    }
}

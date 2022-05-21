import constants
import sys
from PIL import Image, ImageOps
from copy import deepcopy
import base64
import io

class QrCode:

    @staticmethod
    def version_detector(error_corr, text, encoding_type):
        num_of_chars = len(bytearray(text, 'utf-8'))
        for i in range(1, 41):
            if constants.char_capacities[i][error_corr][encoding_type] >= num_of_chars:
                return i
        return -1

    @staticmethod
    def char_count_indicator(text, encoding_type, version, return_binary=False):
        k = int()
        if version <= 9:
            k = constants.character_count_indicator[1][encoding_type]
        elif version <= 26:
            k = constants.character_count_indicator[2][encoding_type]
        else:
            k = constants.character_count_indicator[3][encoding_type]

        if return_binary:
            return f"{len(bytearray(text, 'utf-8')):0{k}b}"
        return k

    def byte_encoding(self):
        text_bytes = bytearray(self.text, 'utf-8')
        byte_lists = []
        byte_lists = [f"{i:08b}" for i in text_bytes]
        # print(byte_lists)
        return ''.join(byte_lists)

    # Not Yet Implemented
    def alphanumeric_encoding(self):
        pass

    # Not Yet Implemented
    def numeric_encoding(self):
        pass

    def __init__(self, text, encoding_type='bytes', error_corr='L', version=None):
        self.text = text
        self.encoding_type = encoding_type
        self.error_corr = error_corr
        if version:
            self.version = version
        else:
            self.version = QrCode.version_detector(error_corr, text, encoding_type)
            if self.version == -1:
                raise Exception(
                    f"Cannot make QR Code of {len(bytes(text, 'utf-8'))} bytes. Try Reduce the error correction if possible.")

    def __str__(self):
        return f"[{self.text}, {self.encoding_type}, {self.error_corr}, {self.version}]"

    # Encode it into binary
    def into_binary(self):

        char_count = QrCode.char_count_indicator(self.text, self.encoding_type, self.version, return_binary=True)

        mode_indi = f"{constants.mode_indicator[self.encoding_type]:04b}"

        encoded_data = ''.join([mode_indi, char_count, self.byte_encoding()])

        required_list = constants.error_corr_table[self.version][self.error_corr]

        required_bits = 8 * ((required_list[1] * required_list[2]) + (required_list[3] * required_list[4]))

        # print(self)
        # print(f"Required - bits:{required_bits}")
        # terminator = ""

        if required_bits - len(encoded_data) >= 4:
            terminator = 4 * '0'
        else:
            terminator = (required_bits - len(encoded_data)) * '0'

        encoded_data += terminator
        if len(encoded_data) % 8 != 0:
            encoded_data += (8 - (len(encoded_data) % 8)) * '0'
        bytes_left = (required_bits - len(encoded_data)) // 8

        pads = [f"{constants.PAD0:08b}" if i % 2 == 0 else f"{constants.PAD1:08b}" for i in range(bytes_left)]

        bin_form = ''.join([encoded_data, *pads])

        int_form = [int(f"{bin_form[i:i + 8]}", base=2) for i in range(0, len(bin_form), 8)]

        iter = 0
        group1 = []
        for i in range(0, required_list[1]):
            block = []
            for j in range(0, required_list[2]):
                block.append(int_form[iter])
                iter += 1
            group1.append(block)
        group2 = []
        for i in range(0, required_list[3]):
            block = []
            for j in range(0, required_list[4]):
                block.append(int_form[iter])
                iter += 1
            group2.append(block)

        error_blocks = []
        for i in group1:
            error_blocks.append(self.poly_div(i.copy()))
        for i in group2:
            error_blocks.append(self.poly_div(i.copy()))
        final_block = []
        if not group2:
            for i in zip(*group1):
                final_block.extend(i)
        else:
            for i in zip(*group1, *group2):
                final_block.extend(i)
            for i in range(len(group2)):
                final_block.append(group2[i][-1])

        for i in zip(*error_blocks):
            final_block.extend(i)
        final_block = map(lambda a: f"{a:08b}", final_block)
        return ''.join(final_block) + ('0' * constants.remain_bits[self.version])

    def poly_div(self, encod_coeff):
        ecc = constants.error_corr_table[self.version][self.error_corr][0]
        encod_coeff.extend([0] * ecc)
        gen_coeff = constants.generator_polynomials[ecc].copy()
        i = 0
        while i < len(encod_coeff) - ecc:
            largest_deg_coeff = encod_coeff[i]
            # print(largest_deg_coeff)
            if largest_deg_coeff != 0:
                encod_coeff[i] ^= largest_deg_coeff
                for j in range(0, ecc):
                    encod_coeff[i + j + 1] = encod_coeff[i + j + 1] ^ constants.galois_log[
                        (gen_coeff[j] + constants.galois_antilog[largest_deg_coeff]) % 255]
                    # print(encod_coeff[i + j + 1], end=" ")
                # print()
                # print(encod_coeff)
            i += 1
        # print(encod_coeff[i:])
        return encod_coeff[i:]


""" 
    The image convention:smallest value is black and largest value is white
    QR Code convetion : 0 is white and 1 is black
"""


class QrBuilder():
    ZERO = 255
    ONE = 0

    # print(size)

    def __init__(self, qrcode):
        self.qrcode = qrcode
        self.size = (constants.version_size[self.qrcode.version], constants.version_size[self.qrcode.version])
        pixel = [128 for i in range(0, self.size[0])]
        self.matrix = [deepcopy(pixel) for i in range(0, self.size[0])]
        self.data = self.qrcode.into_binary()

    def finding_pattern(self, i, j):
        for col in range(j, j + 7):
            self.matrix[i][col] = QrBuilder.ONE
            self.matrix[i + 6][col] = QrBuilder.ONE
        for row in range(i + 1, i + 6):
            self.matrix[row][j] = QrBuilder.ONE
            self.matrix[row][j + 6] = QrBuilder.ONE
        for col in range(j + 1, j + 6):
            self.matrix[i + 1][col] = QrBuilder.ZERO
            self.matrix[i + 5][col] = QrBuilder.ZERO
        for row in range(i + 2, i + 5):
            self.matrix[row][j + 1] = QrBuilder.ZERO
            self.matrix[row][j + 5] = QrBuilder.ZERO
        for row in range(i + 2, i + 5):
            for col in range(j + 2, j + 5):
                self.matrix[row][col] = QrBuilder.ONE

    def finding_position(self):
        self.finding_pattern(0, 0)
        self.finding_pattern(-7, 0)
        self.finding_pattern(0, -7)

        # for separators
        for i in range(0, 8):
            self.matrix[7][i] = QrBuilder.ZERO
            self.matrix[i][7] = QrBuilder.ZERO
            self.matrix[-8][i] = QrBuilder.ZERO
            self.matrix[i][-8] = QrBuilder.ZERO
            self.matrix[-i - 1][7] = QrBuilder.ZERO
            self.matrix[7][-i - 1] = QrBuilder.ZERO

    def alignment_pattern(self, i, j):
        for col in range(j, j + 5):
            self.matrix[i][col] = QrBuilder.ONE
            self.matrix[i + 4][col] = QrBuilder.ONE
        for row in range(i + 1, i + 4):
            self.matrix[row][j] = QrBuilder.ONE
            self.matrix[row][j + 4] = QrBuilder.ONE
        for col in range(j + 1, j + 4):
            self.matrix[i + 1][col] = QrBuilder.ZERO
            self.matrix[i + 3][col] = QrBuilder.ZERO
        for row in range(i + 2, i + 3):
            self.matrix[row][j + 1] = QrBuilder.ZERO
            self.matrix[row][j + 3] = QrBuilder.ZERO
        self.matrix[i + 2][j + 2] = QrBuilder.ONE

    def alignment_position(self):
        align_pos = constants.alignment_position[self.qrcode.version]
        # for dark module
        self.matrix[(4 * self.qrcode.version) + 9][8] = QrBuilder.ONE
        if not align_pos:
            return
        # print(align_pos)
        for j in range(1, len(align_pos) - 1):
            self.alignment_pattern(align_pos[0] - 2, align_pos[j] - 2)
        for i in range(1, len(align_pos) - 1):
            for j in range(0, len(align_pos)):
                self.alignment_pattern(align_pos[i] - 2, align_pos[j] - 2)
        for j in range(1, len(align_pos)):
            self.alignment_pattern(align_pos[-1] - 2, align_pos[j] - 2)

    def timing_position(self):
        size = self.size[0]
        for i in range(8, size - 7):
            if i % 2 == 0:
                self.matrix[i][6] = QrBuilder.ONE
                self.matrix[6][i] = QrBuilder.ONE
            else:
                self.matrix[i][6] = QrBuilder.ZERO
                self.matrix[6][i] = QrBuilder.ZERO

    def format_position(self, matrix, mask_number):
        format = constants.format_pattern[self.qrcode.error_corr][mask_number]
        i = 0
        counter1 = 0
        counter2 = 0
        while i <= 6:
            # print(counter1, counter2)
            if format[i] == '0':
                matrix[8][counter1] = QrBuilder.ZERO
                matrix[-counter2 - 1][8] = QrBuilder.ZERO
            else:
                matrix[8][counter1] = QrBuilder.ONE
                matrix[-counter2 - 1][8] = QrBuilder.ONE
            counter1 += 1
            counter2 += 1
            if counter1 == 6:
                counter1 += 1
            i += 1
        counter1 = 8
        counter2 = -8
        while i < 15:
            if format[i] == '0':
                matrix[counter1][8] = QrBuilder.ZERO
                matrix[8][counter2] = QrBuilder.ZERO
            else:
                matrix[counter1][8] = QrBuilder.ONE
                matrix[8][counter2] = QrBuilder.ONE
            counter1 -= 1
            counter2 += 1
            if counter1 == 6:
                counter1 -= 1
            i += 1

    def version_position(self):
        if self.qrcode.version < 7:
            return
        pattern = constants.version_pattern[self.qrcode.version]
        counter = 17
        for i in range(0, 6):
            for j in range(-11, -8):
                if pattern[counter] == '1':
                    self.matrix[i][j] = QrBuilder.ONE
                    self.matrix[j][i] = QrBuilder.ONE
                else:
                    self.matrix[i][j] = QrBuilder.ZERO
                    self.matrix[j][i] = QrBuilder.ZERO
                counter -= 1

    def masking_pattern(self):
        masks = [deepcopy(self.matrix) for i in range(8)]
        for i in range(8):
            self.format_position(masks[i], i)
            self.fill_data(masks[i], self.data, i)
        return masks

    def mask_score(self, mask):
        score = [0, 0, 0, 0]
        current = mask[0][0]
        # counter = 0
        total = 0
        # for consecutive vertical and horizontal bits
        for i in range(0, len(mask)):
            counter = 0
            for j in range(0, len(mask)):
                pixel = mask[i][j]

                if pixel == current:
                    counter += 1
                else:
                    if counter >= 5:
                        total += (counter - 5) + 3
                    counter = 1
                    current = pixel
            if counter >= 5:
                total += (counter - 5) + 3

        for j in range(0, len(mask)):
            counter = 0
            for i in range(0, len(mask)):
                pixel = mask[i][j]

                if pixel == current:
                    counter += 1
                else:
                    if counter >= 5:
                        total += (counter - 5) + 3
                    counter = 1
                    current = pixel
            if counter >= 5:
                total += (counter - 5) + 3

        score[0] = total

        # Rule 2
        counter = 0
        for i in range(len(mask) - 1):
            for j in range(len(mask) - 1):
                if mask[i][j] == mask[i + 1][j] and mask[i][j] == mask[i + 1][j + 1] and mask[i][j] == mask[i][j + 1]:
                    counter += 1
        score[1] = counter * 3

        # Rule 3
        patterns = [[255, 255, 255, 255, 0, 255, 0, 0, 0, 255, 0],
                    [0, 255, 0, 0, 0, 255, 0, 255, 255, 255, 255]]
        counter = 0
        for i in range(0, len(mask)):
            for j in range(0, len(mask)):
                for pattern in patterns:
                    match = True
                    k = j
                    # for row matches
                    for p in pattern:
                        if k >= len(mask) or mask[i][k] != p:
                            match = False
                            break
                        k += 1
                    if match:
                        counter += 1
                    match = True
                    k = j
                    # for column matches
                    for p in pattern:
                        if k >= len(mask) or mask[k][i] != p:
                            match = False
                            break
                        k += 1
                    if match:
                        counter += 1
        # print(counter)
        score[2] = counter * 40

        # dark_module = 0
        # for i in range(len(mask)):
        #     for j in range(len(mask)):
        #         if mask[i][j] == QrBuilder.ONE:
        #             dark_module += 1
        # Rule 4
        dark_module = sum((1 if j == QrBuilder.ONE else 0 for i in mask for j in i))
        percent = int(dark_module / (len(mask) ** 2) * 100)
        prv = percent - (percent % 5)
        nxt = prv + 5
        prv, nxt = abs(prv - 50) // 10, abs(nxt - 50) // 10
        score[3] = min(prv, nxt) * 10
        return score

    def fill_data(self, matrix, data, mask_number):
        counter = 0
        mask = constants.mask_patterns[mask_number]
        i, j = len(matrix) - 1, len(matrix) - 1
        up = True
        while True:
            # print(i,j)
            if matrix[i][j] == 128:
                if self.data[counter] == '1':
                    matrix[i][j] = QrBuilder.ONE ^ (QrBuilder.ZERO if mask(i, j) else QrBuilder.ONE)
                else:
                    matrix[i][j] = QrBuilder.ZERO ^ (QrBuilder.ZERO if mask(i, j) else QrBuilder.ONE)
                counter += 1
            if counter == len(data):
                break
            if matrix[i][j - 1] == 128:
                if self.data[counter] == '1':
                    matrix[i][j - 1] = QrBuilder.ONE ^ (QrBuilder.ZERO if mask(i, j - 1) else QrBuilder.ONE)
                else:
                    matrix[i][j - 1] = QrBuilder.ZERO ^ (QrBuilder.ZERO if mask(i, j - 1) else QrBuilder.ONE)
                counter += 1
            if counter == len(self.data):
                break
            if up:
                if i == 0:
                    if j - 2 != 6:
                        j -= 2
                    else:
                        j -= 3
                    up = False
                else:
                    i -= 1
            else:
                if i == len(matrix) - 1:
                    j -= 2
                    up = True
                else:
                    i += 1

    def build_image(self, mask_number=None):
        self.finding_position()
        self.alignment_position()
        self.timing_position()
        self.version_position()
        masks = self.masking_pattern()
        if not mask_number:
            mask_scores = [sum(self.mask_score(mask)) for mask in masks]
            mask_number = mask_scores.index(min(mask_scores))
        # for m_s in mask_scores:
        # #     print(m_s)
        pixels = [j for i in masks[mask_number] for j in i]
        # pixels = [j for i in self.matrix for j in i]
        image = Image.new(mode='L', size=self.size)
        image.putdata(pixels)
        image = ImageOps.expand(image, border=4, fill='white')
        image = ImageOps.scale(image, factor=6, resample=Image.Resampling.BOX)
        return image

def PIL_to_dataURL(image):
    data = io.BytesIO()
    image.save(data,"PNG")
    data64 = base64.b64encode(data.getvalue())
    return u'data:image/png;base64,'+data64.decode('utf-8')


# text="https://www.facebook.com/"
# text="ritwick"
# text="हिन्दी"
#
# text = input("Enter PNR:")
text = sys.argv[1]
qr = QrCode(text)
# print(qr)
qrbuilder = QrBuilder(qr)
image = qrbuilder.build_image()
# print(image.size)
# print(image)

text = text.split('/')[-1];
print(PIL_to_dataURL(image),end="")
# image.save(f"{text}.png")
# image.show()

import { Transaction } from '@/types/transaction';
import { formatCurrency, formatThaiDate } from '../utils';

/**
 * Generate LINE Flex Message for Receipt / Expense Confirmation
 */
export function createReceiptFlexMessage(txn: Transaction, dashboardUrl: string) {
  const isExpense = txn.type === 'expense';
  const headerBgColor = isExpense ? '#4551C3' : '#10B981';
  const typeText = isExpense ? '💸 บันทึกรายจ่ายสำเร็จ' : '💰 บันทึกรายรับสำเร็จ';

  // Items list components
  const itemRows: any[] = [];
  if (txn.items && txn.items.length > 0) {
    txn.items.slice(0, 4).forEach((item) => {
      itemRows.push({
        type: 'box',
        layout: 'horizontal',
        contents: [
          {
            type: 'text',
            text: `• ${item.name || 'สินค้า/บริการ'}`,
            size: 'xs',
            color: '#666666',
            flex: 4,
            wrap: true,
          },
          {
            type: 'text',
            text: formatCurrency(item.total, true),
            size: 'xs',
            color: '#333333',
            align: 'end',
            flex: 2,
          },
        ],
      });
    });

    if (txn.items.length > 4) {
      itemRows.push({
        type: 'text',
        text: `+ และอีก ${txn.items.length - 4} รายการ`,
        size: 'xxs',
        color: '#999999',
        margin: 'xs',
      });
    }
  }

  const flexBubble = {
    type: 'bubble',
    size: 'mega',
    header: {
      type: 'box',
      layout: 'vertical',
      backgroundColor: headerBgColor,
      paddingAll: '16px',
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'text',
              text: typeText,
              color: '#FFFFFF',
              weight: 'bold',
              size: 'sm',
            },
            {
              type: 'text',
              text: txn.category || 'ทั่วไป',
              color: '#E0E7FF',
              size: 'xs',
              align: 'end',
              weight: 'bold',
            },
          ],
        },
      ],
    },
    body: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '16px',
      spacing: 'md',
      contents: [
        // Merchant & Total
        {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: txn.merchant || 'ไม่ระบุร้านค้า',
              weight: 'bold',
              size: 'lg',
              color: '#1E1B4B',
              wrap: true,
            },
            {
              type: 'text',
              text: `${formatThaiDate(txn.date)} ${txn.time || ''}`,
              size: 'xs',
              color: '#888888',
              margin: 'xs',
            },
            {
              type: 'box',
              layout: 'horizontal',
              margin: 'md',
              contents: [
                {
                  type: 'text',
                  text: 'ยอดสุทธิ',
                  size: 'sm',
                  color: '#666666',
                  align: 'start',
                  gravity: 'bottom',
                },
                {
                  type: 'text',
                  text: formatCurrency(txn.grandTotal, true),
                  size: 'xxl',
                  weight: 'bold',
                  color: isExpense ? '#E11D48' : '#059669',
                  align: 'end',
                },
              ],
            },
          ],
        },
        {
          type: 'separator',
          color: '#F0F0F0',
        },
        // Tax & Details
        {
          type: 'box',
          layout: 'vertical',
          spacing: 'xs',
          contents: [
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: 'มูลค่าก่อนภาษี:',
                  size: 'xs',
                  color: '#888888',
                },
                {
                  type: 'text',
                  text: formatCurrency(txn.subtotal, true),
                  size: 'xs',
                  color: '#333333',
                  align: 'end',
                },
              ],
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: 'VAT (7%):',
                  size: 'xs',
                  color: '#888888',
                },
                {
                  type: 'text',
                  text: formatCurrency(txn.vat, true),
                  size: 'xs',
                  color: txn.vat > 0 ? '#4551C3' : '#333333',
                  weight: txn.vat > 0 ? 'bold' : 'regular',
                  align: 'end',
                },
              ],
            },
            ...(txn.wht > 0
              ? [
                  {
                    type: 'box',
                    layout: 'horizontal',
                    contents: [
                      {
                        type: 'text',
                        text: 'หัก ณ ที่จ่าย (WHT):',
                        size: 'xs',
                        color: '#888888',
                      },
                      {
                        type: 'text',
                        text: formatCurrency(txn.wht, true),
                        size: 'xs',
                        color: '#EA580C',
                        weight: 'bold',
                        align: 'end',
                      },
                    ],
                  },
                ]
              : []),
            ...(txn.taxId
              ? [
                  {
                    type: 'box',
                    layout: 'horizontal',
                    contents: [
                      {
                        type: 'text',
                        text: 'เลขผู้เสียภาษี:',
                        size: 'xs',
                        color: '#888888',
                      },
                      {
                        type: 'text',
                        text: txn.taxId,
                        size: 'xs',
                        color: '#333333',
                        align: 'end',
                      },
                    ],
                  },
                ]
              : []),
          ],
        },
        // Items list if exists
        ...(itemRows.length > 0
          ? [
              {
                type: 'separator',
                color: '#F0F0F0',
              },
              {
                type: 'box',
                layout: 'vertical',
                spacing: 'xs',
                contents: [
                  {
                    type: 'text',
                    text: 'รายการสินค้าในบิล',
                    size: 'xs',
                    weight: 'bold',
                    color: '#4B5563',
                  },
                  ...itemRows,
                ],
              },
            ]
          : []),
        // Google Drive Status
        {
          type: 'box',
          layout: 'horizontal',
          backgroundColor: '#F3F4F6',
          cornerRadius: '8px',
          paddingAll: '8px',
          margin: 'sm',
          contents: [
            {
              type: 'text',
              text: txn.driveFileId ? '☁️ บันทึกลง Google Drive & Sheets เรียบร้อย' : '📊 บันทึกลง Google Sheets เรียบร้อย',
              size: 'xxs',
              color: '#4B5563',
              align: 'center',
            },
          ],
        },
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      paddingAll: '16px',
      contents: [
        {
          type: 'button',
          style: 'primary',
          color: '#4551C3',
          height: 'sm',
          action: {
            type: 'uri',
            label: '💻 ดูใน Web Dashboard',
            uri: `${dashboardUrl}/transactions`,
          },
        },
      ],
    },
  };

  return {
    type: 'flex',
    altText: `🧾 บันทึกสำเร็จ: ${txn.merchant} ยอด ${formatCurrency(txn.grandTotal, true)}`,
    contents: flexBubble,
  };
}

/**
 * Generate LINE Flex Message for Financial Summary
 */
export function createSummaryFlexMessage(
  summary: {
    totalExpense: number;
    totalIncome: number;
    netProfit: number;
    totalVat: number;
    totalWht: number;
    count: number;
    periodName: string;
  },
  dashboardUrl: string
) {
  const flexBubble = {
    type: 'bubble',
    size: 'mega',
    header: {
      type: 'box',
      layout: 'vertical',
      backgroundColor: '#1E1B4B',
      paddingAll: '16px',
      contents: [
        {
          type: 'text',
          text: `📊 สรุปยอดการเงิน (${summary.periodName})`,
          color: '#FFFFFF',
          weight: 'bold',
          size: 'md',
        },
        {
          type: 'text',
          text: `บันทึกทั้งหมด ${summary.count} รายการ`,
          color: '#9CA3AF',
          size: 'xs',
          margin: 'xs',
        },
      ],
    },
    body: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '16px',
      spacing: 'md',
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'text',
              text: '💸 รายจ่ายรวม',
              size: 'sm',
              color: '#666666',
            },
            {
              type: 'text',
              text: formatCurrency(summary.totalExpense, true),
              size: 'md',
              weight: 'bold',
              color: '#E11D48',
              align: 'end',
            },
          ],
        },
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'text',
              text: '💰 รายรับรวม',
              size: 'sm',
              color: '#666666',
            },
            {
              type: 'text',
              text: formatCurrency(summary.totalIncome, true),
              size: 'md',
              weight: 'bold',
              color: '#059669',
              align: 'end',
            },
          ],
        },
        {
          type: 'separator',
          color: '#F0F0F0',
        },
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'text',
              text: '📈 ยอดสุทธิ',
              size: 'sm',
              weight: 'bold',
              color: '#1F2937',
            },
            {
              type: 'text',
              text: formatCurrency(summary.netProfit, true),
              size: 'lg',
              weight: 'bold',
              color: summary.netProfit >= 0 ? '#059669' : '#E11D48',
              align: 'end',
            },
          ],
        },
        {
          type: 'box',
          layout: 'vertical',
          backgroundColor: '#F9FAFB',
          paddingAll: '10px',
          cornerRadius: '8px',
          spacing: 'xs',
          contents: [
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: 'ภาษีซื้อ (VAT 7%):',
                  size: 'xs',
                  color: '#6B7280',
                },
                {
                  type: 'text',
                  text: formatCurrency(summary.totalVat, true),
                  size: 'xs',
                  color: '#4551C3',
                  align: 'end',
                  weight: 'bold',
                },
              ],
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: 'ภาษีหัก ณ ที่จ่าย (WHT):',
                  size: 'xs',
                  color: '#6B7280',
                },
                {
                  type: 'text',
                  text: formatCurrency(summary.totalWht, true),
                  size: 'xs',
                  color: '#EA580C',
                  align: 'end',
                  weight: 'bold',
                },
              ],
            },
          ],
        },
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '16px',
      contents: [
        {
          type: 'button',
          style: 'primary',
          color: '#4551C3',
          height: 'sm',
          action: {
            type: 'uri',
            label: '📊 ดูรายละเอียดในเว็บ',
            uri: `${dashboardUrl}/dashboard`,
          },
        },
      ],
    },
  };

  return {
    type: 'flex',
    altText: `📊 สรุปยอดการเงิน (${summary.periodName}) รายจ่าย: ${formatCurrency(summary.totalExpense, true)}`,
    contents: flexBubble,
  };
}

/**
 * Generate LINE Flex Message for Help / Guide
 */
export function createHelpFlexMessage() {
  const flexBubble = {
    type: 'bubble',
    size: 'mega',
    header: {
      type: 'box',
      layout: 'vertical',
      backgroundColor: '#4551C3',
      paddingAll: '16px',
      contents: [
        {
          type: 'text',
          text: '🤖 Paypers AI Assistant',
          color: '#FFFFFF',
          weight: 'bold',
          size: 'md',
        },
        {
          type: 'text',
          text: 'คู่มือการส่งข้อมูลค่าใช้จ่าย',
          color: '#E0E7FF',
          size: 'xs',
          margin: 'xs',
        },
      ],
    },
    body: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '16px',
      spacing: 'md',
      contents: [
        {
          type: 'box',
          layout: 'vertical',
          spacing: 'xs',
          contents: [
            {
              type: 'text',
              text: '📸 1. ถ่ายรูปหรือส่งภาพ',
              weight: 'bold',
              size: 'sm',
              color: '#1E1B4B',
            },
            {
              type: 'text',
              text: 'ส่งรูปใบเสร็จ, สลิปโอนเงิน หรือใบกำกับภาษีเข้ามาในแชท AI จะอ่านและจัดหมวดหมู่อัตโนมัติ',
              size: 'xs',
              color: '#666666',
              wrap: true,
            },
          ],
        },
        {
          type: 'separator',
          color: '#F0F0F0',
        },
        {
          type: 'box',
          layout: 'vertical',
          spacing: 'xs',
          contents: [
            {
              type: 'text',
              text: '✍️ 2. พิมพ์ข้อความบันทึก',
              weight: 'bold',
              size: 'sm',
              color: '#1E1B4B',
            },
            {
              type: 'text',
              text: 'ตัวอย่าง: "จ่ายค่าน้ำมัน 1,200 บาท", "ค่ากาแฟ 120 บาท โอนจ่าย", "รับเงินค่าฟรีแลนซ์ 15,000 บาท"',
              size: 'xs',
              color: '#666666',
              wrap: true,
            },
          ],
        },
        {
          type: 'separator',
          color: '#F0F0F0',
        },
        {
          type: 'box',
          layout: 'vertical',
          spacing: 'xs',
          contents: [
            {
              type: 'text',
              text: '📊 3. สรุปยอดเงิน',
              weight: 'bold',
              size: 'sm',
              color: '#1E1B4B',
            },
            {
              type: 'text',
              text: 'พิมพ์ "สรุปวันนี้", "สรุปเดือนนี้" หรือ "ดูยอด" เพื่อให้บอทสรุปยอดการเงิน',
              size: 'xs',
              color: '#666666',
              wrap: true,
            },
          ],
        },
      ],
    },
  };

  return {
    type: 'flex',
    altText: '🤖 คู่มือการใช้งาน Paypers AI',
    contents: flexBubble,
  };
}

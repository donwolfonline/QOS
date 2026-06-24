import { ImageResponse } from 'next/og';
import { CATEGORY_COLORS } from '@/lib/registry-data';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Params
    const title = searchParams.get('title') || 'Q-OS Module Registry';
    const category = searchParams.get('category');
    const author = searchParams.get('author');
    const cpu = searchParams.get('cpu');
    const ram = searchParams.get('ram');

    const hasModuleDetails = !!(cpu && ram && author && category);
    const themeColor = category && CATEGORY_COLORS[category] ? CATEGORY_COLORS[category] : '#00ff41';

    // Fetch Fira Code font
    // We fetch a standard TTF version for Satori (next/og)
    const fontRegular = await fetch(
      'https://cdn.jsdelivr.net/fontsource/fonts/fira-code@latest/latin-400-normal.ttf'
    ).then((res) => res.arrayBuffer());

    const fontBold = await fetch(
      'https://cdn.jsdelivr.net/fontsource/fonts/fira-code@latest/latin-700-normal.ttf'
    ).then((res) => res.arrayBuffer());

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0a0a0a',
            fontFamily: '"Fira Code"',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background Grid Pattern */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'radial-gradient(circle at 25px 25px, #111111 2%, transparent 0%), radial-gradient(circle at 75px 75px, #111111 2%, transparent 0%)',
              backgroundSize: '100px 100px',
              opacity: 0.5,
            }}
          />

          {/* Glowing Orb */}
          <div
            style={{
              position: 'absolute',
              top: '-20%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '60%',
              height: '60%',
              background: `radial-gradient(ellipse, ${themeColor}30, transparent 70%)`,
              filter: 'blur(80px)',
            }}
          />

          {hasModuleDetails ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                width: '85%',
                height: '75%',
                backgroundColor: '#111111',
                border: `2px solid ${themeColor}50`,
                borderRadius: '32px',
                padding: '60px',
                boxShadow: `0 0 60px ${themeColor}20`,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div
                    style={{
                      display: 'flex',
                      padding: '8px 24px',
                      borderRadius: '999px',
                      border: `1px solid ${themeColor}50`,
                      backgroundColor: `${themeColor}15`,
                      color: themeColor,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      fontSize: '24px',
                      fontWeight: 700,
                    }}
                  >
                    {category}
                  </div>
                  <div style={{ display: 'flex', color: '#00d4ff', fontSize: '32px', fontWeight: 700 }}>
                    Q-OS
                  </div>
                </div>

                <div
                  style={{
                    fontSize: '72px',
                    fontWeight: 700,
                    color: 'white',
                    marginTop: '20px',
                    lineHeight: 1.1,
                  }}
                >
                  {title}
                </div>
                <div style={{ display: 'flex', fontSize: '32px', color: '#888888', marginTop: '10px' }}>
                  {`by ${author}`}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  width: '100%',
                  borderTop: '2px solid #222',
                  paddingTop: '40px',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '24px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.1em' }}>CPU</span>
                  <span style={{ fontSize: '48px', color: themeColor, fontWeight: 700 }}>{cpu}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '24px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.1em' }}>RAM</span>
                  <span style={{ fontSize: '48px', color: themeColor, fontWeight: 700 }}>{ram}</span>
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '96px',
                  fontWeight: 700,
                  color: 'white',
                  marginBottom: '20px',
                  textShadow: `0 0 40px ${themeColor}80`,
                }}
              >
                {title}
              </div>
              <div
                style={{
                  fontSize: '40px',
                  color: '#00d4ff',
                  fontWeight: 400,
                }}
              >
                Q-OS Documentation
              </div>
            </div>
          )}
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Fira Code',
            data: fontRegular,
            weight: 400,
            style: 'normal',
          },
          {
            name: 'Fira Code',
            data: fontBold,
            weight: 700,
            style: 'normal',
          },
        ],
      }
    );
  } catch (e: any) {
    console.error('Failed to generate OG image', e);
    return new Response('Failed to generate OG image', { status: 500 });
  }
}

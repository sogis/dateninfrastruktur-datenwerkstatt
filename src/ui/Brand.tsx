export interface BrandConfig {
  productName: string;
  organisationName?: string;
  logoSrc?: string;
  logoAlt?: string;
}

/** Presentation-only branding; never part of a saved project. */
export function Brand({config}: {config: BrandConfig}) {
  return (
    <>
      {config.logoSrc ? (
        <img className="brand-logo" src={config.logoSrc} alt={config.logoAlt ?? ''} />
      ) : (
        <span className="brand-placeholder" aria-hidden="true">
          DW
        </span>
      )}
      <span className="brand-text">
        <span className="brand-name">{config.productName}</span>
        {config.organisationName && (
          <span className="brand-organisation">{config.organisationName}</span>
        )}
      </span>
    </>
  );
}

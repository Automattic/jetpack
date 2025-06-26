const food = `Barilla
Burger
Coca
Cola
Danone
Dominos
Esso
Fanta
Heineken
HelloFresh
Häagen
Dazs
Kelloggs
Milka
Nestlé
Nutella
Pepsi
Starbucks
King
McDonalds
Kat
Sprite
DrPepper
Absolut
`;

const financial = `Amex
Bradesco
Citi
Goldman
Sachs
Lloyds
MercadoPago
Nubank
PagSeguro
PayPal
Revolut
Santander
Square
Stripe
Venmo
Visa
Mastercard
PicPay
Allianz
AXA
BlackRock
Schwab
`;

const automotive = `Audi
BMW
Benz
Ford
Hyundai
Kia
Lamborghini
Land
Rover
Mercedes
Mitsubishi
Nissan
Peugeot
Renault
Skoda
Subaru
Tata
Toyota
Volkswagen
Volvo
Honda
Tesla
Ferrari
Porsche
Maserati
Bentley
Rolls
Royce
Jaguar
Aston
Martin
McLaren
Bugatti
`;

const electronics = `Acer
Dyson
GoPro
HP
HPE
Huawei
JBL
Lenovo
LG
Macintosh
Nikon
Nokia
Philips
Samsung
Sony
Xiaomi
Nintendo
Asus
Fujifilm
Fitbit
Garmin
`;

const fashion = `Adidas
Asics
Balenciaga
Benetton
Cartier
Fila
Gucci
Hermès
Hublot
Lacoste
Louis
Vuitton
Mango
Nike
Puma
RayBan
Reebok
Rolex
Swatch
Zalando
Zara
Giorgio
Armani
Versace
Prada
Fendi
Burberry
Ralph
Lauren
Tommy
Hilfiger
Calvin
Klein
Levi
Strauss
Timberland
Converse
Vans
Crocs
Ugg
Timberland
`;

const travel = `AirFrance
Booking
Expedia
Hilton
Hyatt
KLM
Marriott
Tripadvisor
Airbnb
`;

const media = `BBC
Disney
HBO
Netflix
Spotify
Twitch
YouTube
Hulu
Patreon
Crunchyroll
Funimation
`;

const pharma = `Bayer
Novartis
Pfizer
Roche
Sanofi
GSK
AstraZeneca
Novavax
Moderna
BioNTech
Sanofi
GSK
`;

const commerce = `Alibaba
Amazon
Carrefour
Etsy
Rakuten
Temu
Walmart
eBay
Zalando
BestBuy
HomeDepot
Ikea
`;

const cosmetics = `Chanel
Dior
Estée
Lauder
L'Oréal
Maybelline
Nivea
Sephora
Clinique
Lancôme
Givenchy
Estée
`;

const consumer = `3M
Procter
Gamble
Unilever
Pritt
Bristol
Joma
`;

const tech = `Twilio
DigitalOcean
ClickUp
Fastly
Auth0
Algolia
OpenAI
GoPro
JetBrains
Meta
Apple
Google
Facebook
DuckDuckGo
Instagram
LinkedIn
Vercel
Calendly
Tencent
Adobe
IBM
Kaspersky
Microsoft
Opera
Oracle
Squarespace
HubSpot
Zapier
Coinbase
Binance
Robinhood
Activision
Ubisoft
Rockstar
`;

const logistics = `DoorDash
Uber
Eternal
Grab
Swiggy
Deliveroo
HelloFresh
Wolt
Bolt
Lyft
DHL
FedEx
Postmates
Instacart
Shipt
`;

const dating = `Tinder
Bumble
Badoo
OkCupid
Hinge
Match
Grindr
`;

const education = `Duolingo
Grammarly
Udemy
Petrobras
Shell
edX
Skillshare
Pluralsight
Codecademy
`;

const commodities = `Aramco
Chevron
Ecopetrol
Exxon
`;

const services = `Deloitte
JLL
Salesforce
SAP
Vodafone
`;

const manufacturing = `Bridgestone
Caterpillar
Siemens
BASF
`;

export default [
	food,
	financial,
	automotive,
	electronics,
	fashion,
	travel,
	media,
	pharma,
	commerce,
	cosmetics,
	consumer,
	tech,
	logistics,
	dating,
	education,
	commodities,
	services,
	manufacturing,
]
	.flatMap( block =>
		block
			.trim()
			.split( '\n' )
			.filter( line => line.trim() !== '' )
	)
	.join( '\n' );
